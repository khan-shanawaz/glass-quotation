import * as duckdb from '@duckdb/duckdb-wasm';

const BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: '/duckdb-mvp.wasm',
    mainWorker: '/duckdb-browser-mvp.worker.js',
  },
  eh: {
    mainModule: '/duckdb-eh.wasm',
    mainWorker: '/duckdb-browser-eh.worker.js',
  },
};

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;
let isInitializing = false;

/**
 * Initializes and establishes the WebAssembly DuckDB instance in the browser.
 */
export async function getDuckDBConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  if (typeof window === 'undefined') {
    throw new Error('DuckDB-WASM can only be initialized in the browser.');
  }

  if (conn) return conn;

  if (isInitializing) {
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (conn) return conn;
  }

  isInitializing = true;

  try {
    const logger = new duckdb.ConsoleLogger();
    const bundle = await duckdb.selectBundle(BUNDLES);
    
    const worker = new Worker(bundle.mainWorker!);
    db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule);
    
    conn = await db.connect();

    // Create persistent tables with sync indicators
    await conn.query(`
      CREATE TABLE IF NOT EXISTS company_profile (
        id VARCHAR PRIMARY KEY,
        companyName VARCHAR,
        companyAddress VARCHAR,
        companyPhone VARCHAR,
        companyEmail VARCHAR,
        taxRate DOUBLE,
        logoBase64 VARCHAR,
        termsAndConditions VARCHAR,
        bankDetails VARCHAR,
        updated_at VARCHAR,
        is_dirty INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS saved_quotations (
        id VARCHAR PRIMARY KEY,
        quoteNumber VARCHAR,
        date VARCHAR,
        customerName VARCHAR,
        customerPhone VARCHAR,
        customerEmail VARCHAR,
        notes VARCHAR,
        items VARCHAR,
        discount DOUBLE,
        isDiscountFlat INTEGER,
        transportCharges DOUBLE,
        labourCharges DOUBLE,
        isTaxEnabled INTEGER,
        summary VARCHAR,
        isConvertedToProject INTEGER,
        sizeHeading VARCHAR,
        unitHeading VARCHAR,
        documentTitle VARCHAR,
        updated_at VARCHAR,
        is_dirty INTEGER DEFAULT 0,
        deleted INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR PRIMARY KEY,
        quoteId VARCHAR,
        quoteNumber VARCHAR,
        customerName VARCHAR,
        customerPhone VARCHAR,
        amount DOUBLE,
        status VARCHAR,
        dateCreated VARCHAR,
        tasks VARCHAR,
        updated_at VARCHAR,
        is_dirty INTEGER DEFAULT 0,
        deleted INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR PRIMARY KEY,
        name VARCHAR,
        phone VARCHAR,
        email VARCHAR,
        totalOrdersAmount DOUBLE,
        totalQuotationsCount INTEGER,
        lastActive VARCHAR,
        updated_at VARCHAR,
        is_dirty INTEGER DEFAULT 0,
        deleted INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS categories (
        name VARCHAR PRIMARY KEY,
        updated_at VARCHAR,
        is_dirty INTEGER DEFAULT 0,
        deleted INTEGER DEFAULT 0
      );
    `);

    console.log('🦆 DuckDB-Wasm initialized with tables.');
    isInitializing = false;
    return conn;
  } catch (error) {
    isInitializing = false;
    console.error('Failed to initialize browser DuckDB:', error);
    throw error;
  }
}

/**
 * Executes a SELECT query and returns rows as standard JS objects.
 */
export async function queryDuckDB(sql: string): Promise<any[]> {
  const connection = await getDuckDBConnection();
  const result = await connection.query(sql);
  return result.toArray().map((row: any) => {
    const obj: any = {};
    for (const key of Object.keys(row)) {
      const val = row[key];
      if (typeof val === 'bigint') {
        obj[key] = Number(val);
      } else {
        obj[key] = val;
      }
    }
    return obj;
  });
}

/**
 * Flush all local DuckDB tables into a JSON-serialized backup file inside the user's selected directory handle.
 */
export async function syncDuckDBToFileStorage(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const targetFolder = (window as any).localDatabaseFolderHandle;
  if (!targetFolder) {
    console.log('No offline storage folder linked.');
    return false;
  }

  try {
    const companyProfile = await queryDuckDB('SELECT * FROM company_profile');
    const savedQuotations = await queryDuckDB('SELECT * FROM saved_quotations WHERE deleted = 0');
    const projects = await queryDuckDB('SELECT * FROM projects WHERE deleted = 0');
    const customers = await queryDuckDB('SELECT * FROM customers WHERE deleted = 0');
    const categories = await queryDuckDB('SELECT * FROM categories WHERE deleted = 0');

    const statePayload = {
      database_engine: 'duckdb_wasm_local_mirror',
      schema_version: '3.0.0',
      timestamp: Date.now(),
      updated_at: new Date().toISOString(),
      data: {
        companyProfile: companyProfile[0] || null,
        savedQuotations: savedQuotations.map(q => ({
          ...q,
          items: JSON.parse(q.items || '[]'),
          summary: JSON.parse(q.summary || '{}'),
          isDiscountFlat: q.isDiscountFlat === 1,
          isTaxEnabled: q.isTaxEnabled === 1,
          isConvertedToProject: q.isConvertedToProject === 1
        })),
        projects: projects.map(p => ({
          ...p,
          tasks: JSON.parse(p.tasks || '[]')
        })),
        customers,
        categories: categories.map(c => c.name)
      }
    };

    const fileHandle = await targetFolder.getFileHandle('glass_quotations_local.duckdb', { create: true });
    const writableStream = await fileHandle.createWritable();
    await writableStream.write(JSON.stringify(statePayload, null, 2));
    await writableStream.close();

    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    localStorage.setItem('duckdb_last_sync_timestamp', now);
    console.log('Successfully flushed database snapshot to offline folder.');
    return true;
  } catch (error) {
    console.error('Failed to flush database snapshot to local file:', error);
    return false;
  }
}

/**
 * Stores FileSystemDirectoryHandle in IndexedDB.
 */
export async function storeFolderHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('duckdb_offline_db', 1);
    request.onupgradeneeded = () => {
      const dbObj = request.result;
      if (!dbObj.objectStoreNames.contains('handles')) {
        dbObj.createObjectStore('handles');
      }
    };
    request.onsuccess = () => {
      const dbObj = request.result;
      const tx = dbObj.transaction('handles', 'readwrite');
      const store = tx.objectStore('handles');
      const putReq = store.put(handle, 'folder_handle');
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves FileSystemDirectoryHandle from IndexedDB.
 */
export async function getFolderHandle(): Promise<FileSystemDirectoryHandle | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('duckdb_offline_db', 1);
    request.onupgradeneeded = () => {
      const dbObj = request.result;
      if (!dbObj.objectStoreNames.contains('handles')) {
        dbObj.createObjectStore('handles');
      }
    };
    request.onsuccess = () => {
      const dbObj = request.result;
      if (!dbObj.objectStoreNames.contains('handles')) {
        resolve(null);
        return;
      }
      const tx = dbObj.transaction('handles', 'readonly');
      const store = tx.objectStore('handles');
      const getReq = store.get('folder_handle');
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => reject(getReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Verifies/requests directory readwrite permissions.
 */
export async function verifyFolderPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const opts = { mode: 'readwrite' as const };
  if ((await (handle as any).queryPermission(opts)) === 'granted') {
    return true;
  }
  if ((await (handle as any).requestPermission(opts)) === 'granted') {
    return true;
  }
  return false;
}

