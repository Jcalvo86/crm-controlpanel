/**
 * Lightweight Supabase REST adapter (no SDK dependency).
 * Handles auth and all CRUD operations via fetch.
 */
export class SupabaseRESTService {
  constructor(config, sessionToken = null) {
    this.url = config.url.replace(/\/$/, '');
    this.anonKey = config.anonKey;
    this.sessionToken = sessionToken;
  }

  _headers(extra = {}) {
    const authHeader = this.sessionToken
      ? `Bearer ${this.sessionToken}`
      : `Bearer ${this.anonKey}`;
    return {
      'apikey': this.anonKey,
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...extra
    };
  }

  async getItems(collection) {
    const res = await fetch(`${this.url}/rest/v1/${collection}?select=*&order=created_at.desc`, {
      headers: this._headers()
    });
    if (res.status === 401) throw new Error('Unauthorized');
    if (!res.ok) throw new Error('Error al obtener datos');
    return await res.json();
  }

  async createItem(collection, item) {
    const res = await fetch(`${this.url}/rest/v1/${collection}`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(item)
    });
    if (res.status === 401) throw new Error('Unauthorized');
    if (!res.ok) throw new Error('Error al crear el registro');
    return await res.json();
  }

  async updateItem(collection, id, item) {
    const res = await fetch(`${this.url}/rest/v1/${collection}?id=eq.${id}`, {
      method: 'PATCH',
      headers: this._headers(),
      body: JSON.stringify(item)
    });
    if (res.status === 401) throw new Error('Unauthorized');
    if (!res.ok) throw new Error('Error al actualizar el registro');
    return await res.json();
  }

  async deleteItem(collection, id) {
    const res = await fetch(`${this.url}/rest/v1/${collection}?id=eq.${id}`, {
      method: 'DELETE',
      headers: this._headers()
    });
    if (res.status === 401) throw new Error('Unauthorized');
    if (!res.ok) throw new Error('Error al eliminar el registro');
    return await res.json();
  }

  async signIn(email, password) {
    const res = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': this.anonKey,
        'Authorization': `Bearer ${this.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error_description || err.message || 'Error de inicio de sesión');
    }
    const data = await res.json();
    return {
      token: data.access_token,
      user: data.user
    };
  }
}
