import sqlite3
import json

DB_PATH = 'favorites.db'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS favorites
                 (item_type TEXT, item_id TEXT, item_data TEXT, PRIMARY KEY (item_type, item_id))''')
    c.execute('''CREATE TABLE IF NOT EXISTS notes
                 (item_type TEXT, item_id TEXT, note_text TEXT, PRIMARY KEY (item_type, item_id))''')
    conn.commit()
    conn.close()

def add_favorite(item_type, item_id, item_data):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('INSERT OR REPLACE INTO favorites (item_type, item_id, item_data) VALUES (?, ?, ?)',
              (item_type, item_id, json.dumps(item_data)))
    conn.commit()
    conn.close()

def remove_favorite(item_type, item_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('DELETE FROM favorites WHERE item_type = ? AND item_id = ?', (item_type, item_id))
    conn.commit()
    conn.close()

def get_favorites():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT item_type, item_id, item_data FROM favorites')
    rows = c.fetchall()
    conn.close()
    return [{'type': row[0], 'id': row[1], 'data': json.loads(row[2])} for row in rows]

def add_note(item_type, item_id, note_text):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('INSERT OR REPLACE INTO notes (item_type, item_id, note_text) VALUES (?, ?, ?)',
              (item_type, item_id, note_text))
    conn.commit()
    conn.close()

def update_note(item_type, item_id, note_text):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('UPDATE notes SET note_text = ? WHERE item_type = ? AND item_id = ?',
              (note_text, item_type, item_id))
    conn.commit()
    conn.close()

def delete_note(item_type, item_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('DELETE FROM notes WHERE item_type = ? AND item_id = ?', (item_type, item_id))
    conn.commit()
    conn.close()

def get_notes():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT item_type, item_id, note_text FROM notes')
    rows = c.fetchall()
    conn.close()
    return [{'type': row[0], 'id': row[1], 'note': row[2]} for row in rows]