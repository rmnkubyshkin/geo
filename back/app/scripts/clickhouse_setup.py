from app.extensions import ch

def init_clickhouse_tables():
    if not ch.client:
        print("ClickHouse клиент не инициализирован")
        return False
    
    create_table_query = """
    CREATE TABLE IF NOT EXISTS points_h3 (
        h3_index UInt64,
        created_at DateTime,
        longitude Float64,
        latitude Float64,
        altitude Float64,
        properties_json String
    ) ENGINE = MergeTree()
    ORDER BY (h3_index, created_at)
    """
    
    try:
        ch.client.command(create_table_query)
        print("Таблица points_h3 создана/проверена")
        return True
    except Exception as e:
        print(f"Ошибка создания таблицы: {e}")
        return False


def ensure_clickhouse_tables():
    if not ch.client:
        print("ClickHouse клиент не инициализирован")
        return False
    
    try:
        result = ch.client.command("EXISTS TABLE points_h3")
        if result == 0:
            return init_clickhouse_tables()
        return True
    except Exception as e:
        print(f"Ошибка проверки: {e}")
        return init_clickhouse_tables()