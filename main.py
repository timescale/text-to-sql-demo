import json
import os

from dotenv import load_dotenv
from quart import Quart, render_template, request, jsonify, Response
import pgai.semantic_catalog as sc
import psycopg

load_dotenv()
app = Quart(__name__)


postgres_dsn = os.environ["POSTGRES_DSN"]
model = os.environ["MODEL"]


@app.route("/")
async def hello_world():
    return await render_template("index.html")


@app.route("/generate-sql", methods=["POST"])
async def generate_sql():
    data = await request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    async def generate():
        try:
            async with await psycopg.AsyncConnection.connect(os.environ["POSTGRES_DSN"]) as con:
                catalog = await sc.from_name(con, "default")
                response = await catalog.generate_sql(con, con, "openai:gpt-4.1-nano", data["question"])
                # Send SQL statement immediately
                yield json.dumps({"type": "sql", "sql": response.sql_statement}) + "\n"

                async with con.cursor() as cur:
                    await cur.execute("SET TRANSACTION READ ONLY")
                    await cur.execute(response.sql_statement)
                    columns = [desc[0] for desc in cur.description]
                    rows = await cur.fetchall()
                    # Send results
                    yield json.dumps({"type": "result", "columns": columns, "rows": rows}) + "\n"
                    await cur.execute("ROLLBACK")
        except psycopg.errors.Error as e:
            yield json.dumps({"type": "error", "error": str(e)}) + "\n"

    return Response(generate(), content_type='application/json')
