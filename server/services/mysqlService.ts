import mysql, { Pool } from "mysql2/promise";
import { localStore } from "./localStore";

export interface CompleteUserData {
  profile?: any;
  education?: any[];
  experience?: any[];
  skills?: any[];
  projects?: any[];
  products?: any[];
  others?: any[];
  certifications?: any[];
  documents?: any[];
  resumes?: any[];
  notes?: any[];
  calendarEvents?: any[];
  contacts?: any[];
  currentJob?: any;
  links?: any[];
  resumeLinks?: any[];
  milestones?: any[];
  achievements?: any[];
  testimonials?: any[];
}

class MySQLService {
  private pool: Pool | null = null;
  private isConfigured = false;
  private tablesInspected = false;
  private tableColumns: Record<string, Set<string>> = {};

  constructor() {
    this.initPool();
  }

  private initPool() {
    const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    const host = process.env.MYSQL_HOST || process.env.DB_HOST;
    const user = process.env.MYSQL_USER || process.env.DB_USER;
    const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD;
    const database = process.env.MYSQL_DATABASE || process.env.DB_NAME;
    const port = Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306);

    try {
      if (connectionUrl) {
        console.log("[MySQL Service] Initializing MySQL pool from connection URL...");
        this.pool = mysql.createPool({
          uri: connectionUrl,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
        });
        this.isConfigured = true;
      } else if (host && user && database) {
        console.log(`[MySQL Service] Initializing MySQL pool for ${user}@${host}:${port}/${database}...`);
        this.pool = mysql.createPool({
          host,
          user,
          password: password || "",
          database,
          port,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
        });
        this.isConfigured = true;
      } else {
        console.log("[MySQL Service] MySQL credentials not detected in environment. Using durable local store engine.");
        this.isConfigured = false;
      }
    } catch (e: any) {
      console.warn("[MySQL Service] Failed to initialize MySQL pool, falling back to local store:", e.message);
      this.isConfigured = false;
    }
  }

  public isConnected(): boolean {
    return this.isConfigured && this.pool !== null;
  }

  private async ensureSchema(): Promise<void> {
    if (this.tablesInspected || !this.pool) return;

    try {
      // 1. Ensure users table exists
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS \`users\` (
          id VARCHAR(255) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          password VARCHAR(255),
          is_mail_only BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // 2. Ensure standard JSON tables exist
      const standardJsonTables = [
        "profiles", "education", "experience", "skills", "certifications",
        "documents", "resumes", "notes", "calendar_events", "contacts", "settings"
      ];
      for (const t of standardJsonTables) {
        await this.pool.query(`
          CREATE TABLE IF NOT EXISTS \`${t}\` (
            id VARCHAR(255) PRIMARY KEY,
            user_email VARCHAR(255) NOT NULL,
            data LONGTEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_${t}_user_email (user_email)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
      }

      // 3. Ensure projects table exists with both individual columns and data column
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS \`projects\` (
          id VARCHAR(255) NOT NULL,
          user_email VARCHAR(255) NOT NULL,
          data LONGTEXT,
          name VARCHAR(255),
          category VARCHAR(100),
          type VARCHAR(50) DEFAULT 'project',
          date VARCHAR(50),
          description TEXT,
          tech_stack TEXT,
          live_url TEXT,
          github_url TEXT,
          cover_url LONGTEXT,
          pdf_url LONGTEXT,
          pdf_name VARCHAR(255),
          percentage VARCHAR(50),
          is_public BOOLEAN DEFAULT TRUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          INDEX idx_projects_user_email (user_email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // 4. Ensure products table exists with both individual columns and data column
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS \`products\` (
          id VARCHAR(255) NOT NULL,
          user_email VARCHAR(255) NOT NULL,
          data LONGTEXT,
          name VARCHAR(255),
          category VARCHAR(100),
          type VARCHAR(50) DEFAULT 'product',
          date VARCHAR(50),
          description TEXT,
          tech_stack TEXT,
          live_url TEXT,
          github_url TEXT,
          cover_url LONGTEXT,
          pdf_url LONGTEXT,
          pdf_name VARCHAR(255),
          percentage VARCHAR(50),
          is_public BOOLEAN DEFAULT TRUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          INDEX idx_products_user_email (user_email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Fix any unique constraint or data type conflicts on projects and products
      await this.fixTableConstraints("projects");
      await this.fixTableConstraints("products");

      this.tablesInspected = true;
      console.log("[MySQL Service] Database schema verified and ready.");
    } catch (err: any) {
      console.warn("[MySQL Service] Notice during schema verification:", err.message);
    }
  }

  private async fixTableConstraints(tableName: 'projects' | 'products'): Promise<void> {
    if (!this.pool) return;
    try {
      // 1. Add non-unique index on user_email first so foreign key constraints never block dropping unique index
      try {
        await this.pool.query(`ALTER TABLE \`${tableName}\` ADD INDEX idx_${tableName}_user_email_fk (user_email)`);
      } catch (_) {}

      // 2. Drop any accidental UNIQUE index on user_email alone (which would overwrite records on duplicate key)
      const [indexes]: any = await this.pool.query(
        `SHOW INDEX FROM \`${tableName}\` WHERE Column_name = 'user_email' AND Non_unique = 0 AND Key_name != 'PRIMARY'`
      );
      if (Array.isArray(indexes)) {
        for (const idx of indexes) {
          try {
            console.log(`[MySQL Fix] Removing UNIQUE constraint '${idx.Key_name}' on ${tableName}.user_email to support multiple records...`);
            await this.pool.query(`ALTER TABLE \`${tableName}\` DROP INDEX \`${idx.Key_name}\``);
          } catch (e: any) {
            console.warn(`[MySQL Fix] Could not drop index ${idx.Key_name} on ${tableName}:`, e.message);
          }
        }
      }

      // 3. If user_email is the PRIMARY KEY, change primary key to (id)
      const [priIndexes]: any = await this.pool.query(
        `SHOW INDEX FROM \`${tableName}\` WHERE Key_name = 'PRIMARY' AND Column_name = 'user_email'`
      );
      if (Array.isArray(priIndexes) && priIndexes.length > 0) {
        try {
          console.log(`[MySQL Fix] user_email is PRIMARY KEY in ${tableName}, changing primary key to (id)...`);
          await this.pool.query(`ALTER TABLE \`${tableName}\` DROP PRIMARY KEY, ADD PRIMARY KEY (id)`);
        } catch (e: any) {
          console.warn(`[MySQL Fix] Could not alter primary key on ${tableName}:`, e.message);
        }
      }

      // 4. Verify columns
      const [cols]: any = await this.pool.query(`DESCRIBE \`${tableName}\``);
      if (Array.isArray(cols)) {
        const idCol = cols.find((c: any) => c.Field?.toLowerCase() === 'id');
        if (idCol && (idCol.Type.toLowerCase().startsWith('int') || idCol.Type.toLowerCase().startsWith('bigint'))) {
          try {
            console.log(`[MySQL Fix] Altering ${tableName}.id from ${idCol.Type} to VARCHAR(255)...`);
            await this.pool.query(`ALTER TABLE \`${tableName}\` MODIFY COLUMN id VARCHAR(255) NOT NULL`);
          } catch (e: any) {
            console.warn(`[MySQL Fix] Could not modify ${tableName}.id column type:`, e.message);
          }
        }

        const dataCol = cols.find((c: any) => c.Field?.toLowerCase() === 'data');
        if (dataCol && (dataCol.Type.toLowerCase() === 'text' || dataCol.Type.toLowerCase().startsWith('varchar'))) {
          try {
            await this.pool.query(`ALTER TABLE \`${tableName}\` MODIFY COLUMN data LONGTEXT NOT NULL`);
          } catch (_) {}
        }
      }
    } catch (err: any) {
      console.warn(`[MySQL Fix] Table constraint audit on ${tableName} deferred:`, err.message);
    }
  }

  private async inspectTable(tableName: string): Promise<Set<string>> {
    if (this.tableColumns[tableName]) {
      return this.tableColumns[tableName];
    }
    const cols = new Set<string>();
    if (!this.pool) return cols;

    try {
      const [rows]: any = await this.pool.query(`DESCRIBE \`${tableName}\``);
      if (Array.isArray(rows)) {
        for (const row of rows) {
          if (row.Field) cols.add(row.Field.toLowerCase());
        }
      }
      if (cols.size > 0) {
        this.tableColumns[tableName] = cols;
      }
    } catch (e: any) {
      // Table might not exist yet
    }
    return cols;
  }

  private async saveProjectsOrProducts(tableName: 'projects' | 'products', cleanEmail: string, items: any[]): Promise<void> {
    if (!this.pool) return;
    const cols = await this.inspectTable(tableName);

    // If table doesn't exist yet, run schema creation and re-inspect
    if (cols.size === 0) {
      await this.ensureSchema();
    }
    const activeCols = await this.inspectTable(tableName);

    // 1. If table has 'data' column (or standard JSON format), save full array
    if (activeCols.has("data")) {
      try {
        const payloadString = JSON.stringify(items);
        const [existing]: any = await this.pool.query(
          `SELECT id FROM \`${tableName}\` WHERE user_email = ? LIMIT 1`,
          [cleanEmail]
        );

        if (Array.isArray(existing) && existing.length > 0) {
          await this.pool.query(
            `UPDATE \`${tableName}\` SET data = ?, updated_at = NOW() WHERE id = ?`,
            [payloadString, existing[0].id]
          );
        } else {
          const newId = `${tableName.slice(0, 4)}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await this.pool.query(
            `INSERT INTO \`${tableName}\` (id, user_email, data, updated_at) VALUES (?, ?, ?, NOW())`,
            [newId, cleanEmail, payloadString]
          );
        }
        console.log(`[MySQL Service] Saved array of ${items.length} records into '${tableName}' (data JSON column) for ${cleanEmail}`);
      } catch (jsonErr: any) {
        console.warn(`[MySQL Service] Notice saving '${tableName}' via JSON data column:`, jsonErr.message);
      }
    }

    // 2. If table also has separate row columns (e.g. name, category, description), save individual rows
    if (activeCols.has("name") && activeCols.has("id")) {
      try {
        // Clean up any items for this user that are not in current list
        const currentIds = items.map((p: any) => p.id).filter(Boolean);
        if (currentIds.length > 0) {
          const placeholders = currentIds.map(() => '?').join(',');
          await this.pool.query(
            `DELETE FROM \`${tableName}\` WHERE user_email = ? AND id NOT IN (${placeholders})`,
            [cleanEmail, ...currentIds]
          );
        } else {
          await this.pool.query(`DELETE FROM \`${tableName}\` WHERE user_email = ?`, [cleanEmail]);
        }

        for (const item of items) {
          const itemId = item.id || `${tableName.slice(0, 4)}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await this.pool.query(
            `INSERT INTO \`${tableName}\` 
              (id, user_email, name, category, type, date, description, tech_stack, live_url, github_url, cover_url, pdf_url, pdf_name, percentage, is_public, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE
              name = VALUES(name),
              category = VALUES(category),
              type = VALUES(type),
              date = VALUES(date),
              description = VALUES(description),
              tech_stack = VALUES(tech_stack),
              live_url = VALUES(live_url),
              github_url = VALUES(github_url),
              cover_url = VALUES(cover_url),
              pdf_url = VALUES(pdf_url),
              pdf_name = VALUES(pdf_name),
              percentage = VALUES(percentage),
              is_public = VALUES(is_public),
              updated_at = NOW()`,
            [
              itemId,
              cleanEmail,
              item.name || "",
              item.category || "utilities",
              item.type || (tableName === 'products' ? 'product' : 'project'),
              item.date || "",
              item.description || "",
              JSON.stringify(item.techStack || []),
              item.liveUrl || "",
              item.githubUrl || "",
              item.coverUrl || "",
              item.pdfUrl || "",
              item.pdfName || "",
              item.percentage || "",
              item.isPublic !== false
            ]
          );
        }
        console.log(`[MySQL Service] Saved ${items.length} individual '${tableName}' rows for user: ${cleanEmail}`);
      } catch (rowErr: any) {
        console.warn(`[MySQL Service] Notice saving '${tableName}' individual rows:`, rowErr.message);
      }
    }
  }

  /**
   * Save complete user data payload to MySQL or local store.
   */
  async saveUserData(email: string, rawData: CompleteUserData): Promise<CompleteUserData> {
    const cleanEmail = email.toLowerCase().trim();
    const projects = Array.isArray(rawData.projects) ? rawData.projects : [];
    const products = Array.isArray(rawData.products) ? rawData.products : [];
    const others = Array.isArray(rawData.others) ? rawData.others : [];

    console.log(`[MySQL Service] Saving workspace data for ${cleanEmail}:`);
    console.log(`[MySQL Service] Projects count: ${projects.length}`);
    console.log(`[MySQL Service] Products count: ${products.length}`);
    console.log(`[MySQL Service] Others/documents count: ${others.length}`);

    // Always keep local disk store up to date as reliable mirror
    localStore.saveUserData(cleanEmail, {
      ...rawData,
      projects,
      products,
      others
    });

    if (!this.isConnected()) {
      console.log(`[MySQL Service] Saved ${projects.length} projects and ${products.length} products to local store cache for ${cleanEmail}.`);
      return rawData;
    }

    try {
      await this.ensureSchema();

      // 1. Save or update user in 'users' table
      try {
        const [userRows]: any = await this.pool!.query(
          "SELECT email FROM users WHERE email = ? LIMIT 1",
          [cleanEmail]
        );
        if (!Array.isArray(userRows) || userRows.length === 0) {
          await this.pool!.query(
            "INSERT INTO users (id, email, first_name, last_name, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
            [
              `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              cleanEmail,
              rawData.profile?.firstName || "",
              rawData.profile?.lastName || ""
            ]
          );
        }
      } catch (userErr: any) {
        console.warn("[MySQL Service] Non-critical warning ensuring user record:", userErr.message);
      }

      // Helper to save table with JSON column 'data'
      const saveJsonTable = async (tableName: string, payload: any) => {
        try {
          const payloadString = JSON.stringify(payload);
          const [existing]: any = await this.pool!.query(
            `SELECT id FROM \`${tableName}\` WHERE user_email = ? LIMIT 1`,
            [cleanEmail]
          );

          if (Array.isArray(existing) && existing.length > 0) {
            await this.pool!.query(
              `UPDATE \`${tableName}\` SET data = ?, updated_at = NOW() WHERE id = ?`,
              [payloadString, existing[0].id]
            );
          } else {
            const newId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            await this.pool!.query(
              `INSERT INTO \`${tableName}\` (id, user_email, data, updated_at) VALUES (?, ?, ?, NOW())`,
              [newId, cleanEmail, payloadString]
            );
          }
        } catch (tableErr: any) {
          console.warn(`[MySQL Service] Warning saving JSON table '${tableName}':`, tableErr.message);
        }
      };

      // 2. Save Projects (supports multiple projects across both JSON column and row schemas)
      await this.saveProjectsOrProducts("projects", cleanEmail, projects);

      // 3. Save Products (supports multiple products across both JSON column and row schemas)
      await this.saveProjectsOrProducts("products", cleanEmail, products);

      // 4. Save other workspace tables
      const otherTables = [
        { name: "profiles", payload: rawData.profile || {} },
        { name: "education", payload: rawData.education || [] },
        { name: "experience", payload: rawData.experience || [] },
        { name: "skills", payload: rawData.skills || [] },
        { name: "certifications", payload: rawData.certifications || [] },
        { name: "documents", payload: rawData.documents || [] },
        { name: "resumes", payload: rawData.resumes || [] },
        { name: "notes", payload: rawData.notes || [] },
        { name: "calendar_events", payload: rawData.calendarEvents || [] },
        { name: "contacts", payload: rawData.contacts || [] },
        { name: "settings", payload: rawData.currentJob || {} },
      ];

      for (const t of otherTables) {
        await saveJsonTable(t.name, t.payload);
      }

      console.log(`[MySQL Service] Successfully saved ${projects.length} projects and ${products.length} products to MySQL for ${cleanEmail}!`);
    } catch (dbError: any) {
      console.error("[MySQL Service] Error executing MySQL query, local store active as fallback:", dbError.message);
    }

    return rawData;
  }

  /**
   * Retrieve complete user data payload from MySQL or local store.
   */
  async getUserData(email: string): Promise<CompleteUserData> {
    const cleanEmail = email.toLowerCase().trim();

    // Default to localStore baseline
    const localData = localStore.getUserData(cleanEmail);

    if (!this.isConnected()) {
      console.log(`[MySQL Service] Retrieved ${localData.projects?.length || 0} projects and ${localData.products?.length || 0} products from local store for ${cleanEmail}.`);
      return localData;
    }

    try {
      await this.ensureSchema();
      console.log(`[MySQL Service] Fetching workspace data from MySQL for: ${cleanEmail}`);

      // Helper to fetch JSON table
      const fetchJsonTable = async (tableName: string) => {
        try {
          const [rows]: any = await this.pool!.query(
            `SELECT data FROM \`${tableName}\` WHERE user_email = ? LIMIT 1`,
            [cleanEmail]
          );
          if (Array.isArray(rows) && rows.length > 0 && rows[0].data) {
            const raw = rows[0].data;
            return typeof raw === "string" ? JSON.parse(raw) : raw;
          }
        } catch (e: any) {
          // Table or column might differ
        }
        return null;
      };

      // Helper to fetch Projects or Products (handles row-based or JSON-based tables)
      const fetchCollection = async (tableName: 'projects' | 'products'): Promise<any[] | null> => {
        try {
          const cols = await this.inspectTable(tableName);

          // 1. Try row-based query first if individual columns exist
          if (cols.has("name") && cols.has("id")) {
            const orderBy = cols.has("date") ? "ORDER BY date DESC" : "";
            const [rows]: any = await this.pool!.query(
              `SELECT * FROM \`${tableName}\` WHERE user_email = ? ${orderBy}`.trim(),
              [cleanEmail]
            );
            if (Array.isArray(rows) && rows.length > 0) {
              return rows.map((r: any) => ({
                id: r.id,
                name: r.name,
                category: r.category,
                type: r.type || (tableName === 'products' ? 'product' : 'project'),
                date: r.date,
                description: r.description,
                techStack: typeof r.tech_stack === "string" ? JSON.parse(r.tech_stack || "[]") : (r.tech_stack || []),
                liveUrl: r.live_url,
                githubUrl: r.github_url,
                coverUrl: r.cover_url,
                pdfUrl: r.pdf_url,
                pdfName: r.pdf_name,
                percentage: r.percentage,
                isPublic: r.is_public !== 0 && r.is_public !== false
              }));
            }
          }

          // 2. Fall back to JSON data column
          if (cols.has("data")) {
            const fromJson = await fetchJsonTable(tableName);
            if (Array.isArray(fromJson) && fromJson.length > 0) {
              return fromJson;
            }
          }
        } catch (err: any) {
          console.warn(`[MySQL Service] Warning fetching collection '${tableName}':`, err.message);
        }
        return null;
      };

      // 1. Fetch Projects
      const loadedProjects = await fetchCollection("projects");

      // 2. Fetch Products
      const loadedProducts = await fetchCollection("products");

      const finalProjects = Array.isArray(loadedProjects) && loadedProjects.length > 0
        ? loadedProjects 
        : (localData.projects || []);
      const finalProducts = Array.isArray(loadedProducts) && loadedProducts.length > 0
        ? loadedProducts 
        : (localData.products || []);

      console.log(`[MySQL Service] Retrieved ${finalProjects.length} projects and ${finalProducts.length} products for ${cleanEmail}.`);

      const completeData: CompleteUserData = {
        profile: (await fetchJsonTable("profiles")) || localData.profile || {},
        education: (await fetchJsonTable("education")) || localData.education || [],
        experience: (await fetchJsonTable("experience")) || localData.experience || [],
        skills: (await fetchJsonTable("skills")) || localData.skills || [],
        projects: finalProjects,
        products: finalProducts,
        others: localData.others || [],
        certifications: (await fetchJsonTable("certifications")) || localData.certifications || [],
        documents: (await fetchJsonTable("documents")) || localData.documents || [],
        resumes: (await fetchJsonTable("resumes")) || localData.resumes || [],
        notes: (await fetchJsonTable("notes")) || localData.notes || [],
        calendarEvents: (await fetchJsonTable("calendar_events")) || localData.calendarEvents || [],
        contacts: (await fetchJsonTable("contacts")) || localData.contacts || [],
        currentJob: (await fetchJsonTable("settings")) || localData.currentJob || {},
      };

      // Keep local store in sync with MySQL query result
      localStore.saveUserData(cleanEmail, completeData);

      return completeData;
    } catch (e: any) {
      console.error("[MySQL Service] Error fetching from MySQL, returning local store copy:", e.message);
      return localData;
    }
  }

  async getAllUsers(): Promise<any[]> {
    if (!this.isConnected()) {
      return localStore.getAllUsers();
    }
    try {
      const [rows]: any = await this.pool!.query(
        "SELECT id, email, first_name, last_name, password, is_mail_only FROM users"
      );
      if (Array.isArray(rows) && rows.length > 0) {
        return rows;
      }
    } catch (e: any) {
      console.warn("[MySQL Service] Error querying users table:", e.message);
    }
    return localStore.getAllUsers();
  }

  async createUser(email: string, passwordHash: string, firstName?: string, lastName?: string, isMailOnly = false): Promise<any> {
    const cleanEmail = email.toLowerCase().trim();
    localStore.createUser(cleanEmail, passwordHash, firstName, lastName, isMailOnly);

    if (this.isConnected()) {
      try {
        const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await this.pool!.query(
          "INSERT INTO users (id, email, password, first_name, last_name, is_mail_only, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name), updated_at = NOW()",
          [id, cleanEmail, passwordHash || "", firstName || "", lastName || "", isMailOnly]
        );
      } catch (e: any) {
        console.warn("[MySQL Service] Error inserting into users table:", e.message);
      }
    }

    return {
      $id: cleanEmail,
      email: cleanEmail,
      first_name: firstName,
      last_name: lastName,
      is_mail_only: isMailOnly
    };
  }
}

export const mysqlService = new MySQLService();
