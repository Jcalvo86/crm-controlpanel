/**
 * GLOSAURIO — supabase-adapter.js
 *
 * Adapter para Supabase usando la REST API directamente (sin SDK).
 * No requiere npm ni build tools. Funciona con fetch() nativo.
 *
 * Configuración esperada:
 *   { url: "https://xxx.supabase.co", anonKey: "eyJ...", table: "terms" }
 *
 * SQL para crear la tabla en Supabase:
 * Ver setup.html → Paso 2 → sección "Configuración de base de datos"
 */

window.Glosaurio = window.Glosaurio || {};

window.Glosaurio.SupabaseAdapter = class SupabaseAdapter {
  constructor(config) {
    this.provider = 'supabase';
    this.url      = config.url.replace(/\/$/, ''); // sin trailing slash
    this.anonKey  = config.anonKey;
  }

  // ── HTTP helpers ──────────────────────────────────────────
  _headers(extra = {}) {
    return {
      'apikey':        this.anonKey,
      'Authorization': `Bearer ${this.anonKey}`,
      'Content-Type':  'application/json',
      'Prefer':        'return=representation',
      ...extra
    };
  }

  _getUrl(collection) {
    return `${this.url}/rest/v1/${collection}`;
  }

  // Mapea genéricamente un objeto del frontend (camelCase) al backend Supabase (snake_case)
  _toRow(data) {
    const row = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // Convierte camelCase a snake_case
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        row[snakeKey] = data[key];
      }
    }
    return row;
  }

  // Mapea genéricamente una fila de Supabase (snake_case) al formato JS del frontend (camelCase)
  _fromRow(row) {
    if (!row) return null;
    const data = {};
    for (const key in row) {
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        // Convierte snake_case a camelCase
        const camelKey = key.replace(/([-_][a-z])/g, group =>
          group.toUpperCase().replace('-', '').replace('_', '')
        );
        data[camelKey] = row[key];
      }
    }
    return data;
  }

  // ── Interface implementation (Generic Methods) ───────────────────────
  async getItems(collection, filters = {}) {
    let params = 'select=*&order=created_at.desc';
    if (filters.published) params += '&is_draft=eq.false';
    if (filters.category)  params += `&category=eq.${encodeURIComponent(filters.category)}`;

    const res = await fetch(`${this._getUrl(collection)}?${params}`, {
      headers: this._headers({ 'Prefer': '' })
    });
    if (!res.ok) throw new Error(`Error fetching from ${collection}: ${res.status}`);
    const rows = await res.json();
    return rows.map(r => this._fromRow(r));
  }

  async getItem(collection, id) {
    const res = await fetch(`${this._getUrl(collection)}?id=eq.${id}&select=*`, {
      headers: this._headers({ 'Prefer': '' })
    });
    if (!res.ok) throw new Error(`Error fetching item from ${collection}: ${res.status}`);
    const rows = await res.json();
    return rows.length > 0 ? this._fromRow(rows[0]) : null;
  }

  async createItem(collection, data) {
    const res = await fetch(this._getUrl(collection), {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(this._toRow(data))
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Error creating item in ${collection}: ${res.status} — ${err}`);
    }
    const rows = await res.json();
    return this._fromRow(rows[0]);
  }

  async updateItem(collection, id, data) {
    const res = await fetch(`${this._getUrl(collection)}?id=eq.${id}`, {
      method: 'PATCH',
      headers: this._headers(),
      body: JSON.stringify(this._toRow(data))
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Error updating item in ${collection}: ${res.status} — ${err}`);
    }
    const rows = await res.json();
    return this._fromRow(rows[0]);
  }

  async deleteItem(collection, id) {
    const res = await fetch(`${this._getUrl(collection)}?id=eq.${id}`, {
      method: 'DELETE',
      headers: this._headers({ 'Prefer': '' })
    });
    if (!res.ok) throw new Error(`Error deleting item from ${collection}: ${res.status}`);
  }

  // ── Backward Compatible Specific Methods ──────────────────
  async getTerms(filters = {}) {
    return this.getItems('terms', filters);
  }

  async getTerm(id) {
    return this.getItem('terms', id);
  }

  async createTerm(data) {
    return this.createItem('terms', data);
  }

  async updateTerm(id, data) {
    return this.updateItem('terms', id, data);
  }

  async deleteTerm(id) {
    return this.deleteItem('terms', id);
  }

  async seedTerms(terms) {
    const rows = terms.map(t => this._toRow(t));
    const res = await fetch(this._getUrl('terms'), {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(rows)
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Error seeding terms: ${res.status} — ${err}`);
    }
    const inserted = await res.json();
    return inserted.map(r => this._fromRow(r));
  }

  async testConnection(collection = 'terms') {
    try {
      const res = await fetch(`${this._getUrl(collection)}?select=id&limit=1`, {
        headers: this._headers({ 'Prefer': '' })
      });
      if (res.status === 200 || res.status === 206) {
        return { ok: true, message: `Conexión a Supabase exitosa ✓ (colección/tabla: ${collection})` };
      }
      if (res.status === 401) {
        return { ok: false, message: 'Clave de API incorrecta (401 Unauthorized)' };
      }
      if (res.status === 404) {
        return { ok: false, message: `Tabla "${collection}" no encontrada. Ejecuta el SQL de configuración.` };
      }
      const body = await res.text();
      return { ok: false, message: `Error ${res.status}: ${body}` };
    } catch (err) {
      return { ok: false, message: `Error de red: ${err.message}. Verifica la URL del proyecto.` };
    }
  }
};
