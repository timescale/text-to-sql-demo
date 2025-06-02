document.addEventListener('DOMContentLoaded', () => {
    const questionInput = document.getElementById('question');
    const sqlOutput = document.getElementById('sql-output');
    const submitBtn = document.getElementById('submit-btn');
    const resultsTable = document.getElementById('results-table');
    const resultsTableError = document.getElementById('results-table-error');

    function renderResultsTable(columns, rows) {
        const thead = resultsTable.querySelector('thead');
        const tbody = resultsTable.querySelector('tbody');
        // Clear previous content
        thead.innerHTML = '';
        tbody.innerHTML = '';

        if (!columns || columns.length === 0) return;

        // Header
        const headerRow = document.createElement('tr');
        columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        // Rows
        rows.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    }

    submitBtn.addEventListener('click', () => {
        (async () => {
            const question = questionInput.value;
            submitBtn.disabled = true;
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Loading...';

            sqlOutput.value = '';
            resultsTableError.value = '';
            renderResultsTable([], []);

            try {
                const response = await fetch('/generate-sql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ question })
                });
                const reader = response.body.getReader();
                const decoder = new TextDecoder('utf-8');

                while(true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value);
                    for (const line of chunk.split('\n').filter(Boolean)) {
                        const data = JSON.parse(line);
                        if (data.type === 'sql') {
                            console.log('got sql');
                            sqlOutput.value = data.sql;
                        } else if (data.type === 'result') {
                            console.log('got result');
                            const columns = data.columns;
                            const rows = data.rows;
                            renderResultsTable(columns, rows);
                        } else if (data.type === 'error') {
                            sqlOutput.value = 'Error: ' + data.message;
                            renderResultsTable([], []);
                        }
                    }
                }
            } catch (error) {
                sqlOutput.value = 'Request failed: ' + error;
                renderResultsTable([], []);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        })();
    });
});
