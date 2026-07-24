/**
 * GLOSAURIO — firebase-adapter.js
 *
 * Adapter para Firebase Firestore usando la REST API.
 * No requiere npm ni build tools.
 *
 * Configuración esperada:
 *   { apiKey, projectId, collection }
 *
 * NOTA: Esta implementación usa la Firestore REST API v1.
 * Requiere que Firestore esté habilitado en el proyecto de Firebase.
 *
 * URL base: https://firestore.googleapis.com/v1/projects/{projectId}/databases/(default)/documents/{collection}
 */

window.Glosaurio = window.Glosaurio || {};

window.Glosaurio.FirebaseAdapter = class FirebaseAdapter {
  constructor(config) {
    this.provider   = 'firebase';
    this.apiKey     = config.apiKey;
    this.projectId  = config.projectId;
  }

  // ── Generic Dynamic Firestore Mapping ────────────────────
  _toFirestore(item) {
    return {
      fields: this._valToFirestore(item).mapValue.fields
    };
  }

  _valToFirestore(val) {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === 'boolean')          return { booleanValue: val };
    if (typeof val === 'number')           return { integerValue: val };
    if (typeof val === 'string')           return { stringValue: val };
    if (Array.isArray(val)) {
      return {
        arrayValue: {
          values: val.map(v => this._valToFirestore(v))
        }
      };
    }
    if (typeof val === 'object') {
      const fields = {};
      for (const [k, v] of Object.entries(val)) {
        fields[k] = this._valToFirestore(v);
      }
      return { mapValue: { fields } };
    }
    return { stringValue: String(val) };
  }

  _fromFirestore(doc) {
    if (!doc) return null;
    const data = this._valFromFirestore({ mapValue: { fields: doc.fields || {} } });
    // Extrae el ID del path del documento
    if (doc.name) {
      data.id = doc.name.split('/').pop();
    }
    data.createdAt = doc.createTime;
    data.updatedAt = doc.updateTime;
    return data;
  }

  _valFromFirestore(fVal) {
    if (!fVal) return null;
    if (fVal.nullValue !== undefined)    return null;
    if (fVal.booleanValue !== undefined) return fVal.booleanValue;
    if (fVal.integerValue !== undefined) return parseInt(fVal.integerValue);
    if (fVal.doubleValue !== undefined)  return parseFloat(fVal.doubleValue);
    if (fVal.stringValue !== undefined)  return fVal.stringValue;
    if (fVal.arrayValue !== undefined) {
      return (fVal.arrayValue.values || []).map(v => this._valFromFirestore(v));
    }
    if (fVal.mapValue !== undefined) {
      const obj = {};
      for (const [k, v] of Object.entries(fVal.mapValue.fields || {})) {
        obj[k] = this._valFromFirestore(v);
      }
      return obj;
    }
    return null;
  }

  _url(collection, path = '') {
    const baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/${collection}`;
    return `${baseUrl}${path}?key=${this.apiKey}`;
  }

  // ── Interface implementation (Generic Methods) ───────────
  async getItems(collection, filters = {}) {
    const res = await fetch(this._url(collection));
    if (!res.ok) throw new Error(`Firebase error fetching ${collection} — ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const docs = data.documents || [];
    let items = docs.map(d => this._fromFirestore(d));
    if (filters.published) items = items.filter(t => !t.isDraft);
    if (filters.category)  items = items.filter(t => t.category === filters.category);
    return items;
  }

  async getItem(collection, id) {
    const res = await fetch(this._url(collection, `/${id}`));
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Firebase error ${res.status}`);
    return this._fromFirestore(await res.json());
  }

  async createItem(collection, data) {
    const res = await fetch(this._url(collection), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this._toFirestore(data))
    });
    if (!res.ok) throw new Error(`Firebase create error in ${collection} — ${res.status}: ${await res.text()}`);
    return this._fromFirestore(await res.json());
  }

  async updateItem(collection, id, data) {
    const fireData = this._toFirestore(data);
    const fields = Object.keys(fireData.fields).map(f => `updateMask.fieldPaths=${f}`).join('&');
    const baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/${collection}`;
    const res = await fetch(`${baseUrl}/${id}?key=${this.apiKey}&${fields}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fireData)
    });
    if (!res.ok) throw new Error(`Firebase update error in ${collection} — ${res.status}: ${await res.text()}`);
    return this._fromFirestore(await res.json());
  }

  async deleteItem(collection, id) {
    const res = await fetch(this._url(collection, `/${id}`), { method: 'DELETE' });
    if (!res.ok) throw new Error(`Firebase delete error in ${collection} — ${res.status}`);
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
    const results = [];
    for (const term of terms) {
      const created = await this.createTerm(term);
      results.push(created);
    }
    return results;
  }

  async testConnection(collection = 'terms') {
    try {
      const res = await fetch(`https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/${collection}?key=${this.apiKey}&pageSize=1`);
      if (res.status === 200 || res.status === 404) {
        return { ok: true, message: `Conexión a Firebase exitosa ✓ (proyecto: ${this.projectId}, base de datos vacía)` };
      }
      if (res.status === 403) {
        return { ok: false, message: 'Acceso denegado (403). Verifica las Firestore Rules.' };
      }
      if (res.status === 400) {
        return { ok: false, message: `API Key inválida o proyecto no encontrado (400).` };
      }
      const body = await res.text();
      return { ok: false, message: `Error ${res.status}: ${body}` };
    } catch (err) {
      return { ok: false, message: `Error de red: ${err.message}` };
    }
  }
};
