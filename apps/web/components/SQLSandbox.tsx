'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Copy, RefreshCw, Play } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import CodeMirror from '@uiw/react-codemirror'
import { sql } from '@codemirror/lang-sql'
import { autocompletion } from '@codemirror/autocomplete'
import { CompletionContext, Completion } from '@codemirror/autocomplete'
import type { ViewUpdate } from '@codemirror/view';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001'
// console.log('SERVER_URL:', SERVER_URL);

interface SchemaInfo {
    [tableName: string]: {
        columns: { name: string; type: string }[];
        data: Record<string, unknown>[];
        totalRows: number;
    };
}

interface QueryResult {
    query: string;
    columns: string[];
    rows: Record<string, unknown>[];
}

export default function SQLSandbox() {
    const [userId, setUserId] = useState('');
    const [sqlQuery, setSqlQuery] = useState('');
    const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
    const [queryError, setQueryError] = useState<string | null>(null);
    const [sandboxUrl, setSandboxUrl] = useState('');
    const [schemaInfo, setSchemaInfo] = useState<SchemaInfo | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
    const [activeTable, setActiveTable] = useState<string | null>(null);
    const [activeQuery, setActiveQuery] = useState<string | null>(null);


    const fetchSchemaInfo = useCallback(async (id: string) => {
        try {
            const response = await fetch(`${SERVER_URL}/api/schema`, {
                headers: { 'X-User-ID': id }
            });
            const result = await response.json();
            if (result.success) {
                setSchemaInfo(result.data);
                setFetchError(null);
                setLastRefreshTime(new Date());
                if (!activeTable || !result.data[activeTable]) {
                    const tables = Object.keys(result.data);
                    if (tables.length > 0) {
                        setActiveTable(tables[0]);
                    } else {
                        setActiveTable(null);
                    }
                }
            } else {
                setFetchError(`Failed to fetch schema: ${result.error}`);
            }
        } catch (error) {
            setFetchError(`Error fetching schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [activeTable]);

    useEffect(() => {
        const storedUserId = localStorage.getItem('sqlSandboxUserId');
        const newUserId = storedUserId || uuidv4();
        if (!storedUserId) {
            localStorage.setItem('sqlSandboxUserId', newUserId);
        }
        setUserId(newUserId);
        setSandboxUrl(`${window.location.origin}/sandbox/${newUserId}`);
        fetchSchemaInfo(newUserId);
    }, [fetchSchemaInfo]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;
        if (autoRefresh) {
            intervalId = setInterval(() => {
                fetchSchemaInfo(userId);
            }, 5000);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [autoRefresh, userId, fetchSchemaInfo]);

    const handleManualRefresh = () => {
        fetchSchemaInfo(userId);
    };

    // const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    //     setSqlQuery(e.target.value)
    // }
    // Function to split queries at semicolons, preserving semicolons inside quotes
    const splitQueries = (text: string): string[] => {
        const queries: string[] = [];
        let currentQuery = '';
        let inQuotes = false;
        let quoteChar = '';

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            if ((char === '"' || char === "'") && text[i - 1] !== '\\') {
                if (!inQuotes) {
                    inQuotes = true;
                    quoteChar = char;
                } else if (char === quoteChar) {
                    inQuotes = false;
                }
            }

            if (char === ';' && !inQuotes) {
                if (currentQuery.trim()) {
                    queries.push(currentQuery.trim());
                }
                currentQuery = '';
            } else {
                currentQuery += char;
            }
        }

        if (currentQuery.trim()) {
            queries.push(currentQuery.trim());
        }

        return queries.filter(q => q.length > 0);
    };

    const handleEditorChange = (value: string) => {
        setSqlQuery(value);
        setActiveQuery(null);
    };

    const handleCursorActivity = (viewUpdate: ViewUpdate) => {
        const selection = viewUpdate.state.selection.main;
        if (selection.empty) {
            const text = viewUpdate.state.doc.toString();
            const queries = splitQueries(text);
            let pos = 0;
            for (const query of queries) {
                const queryEnd = pos + query.length;
                if (selection.from >= pos && selection.from <= queryEnd) {
                    setActiveQuery(query);
                    break;
                }
                pos = queryEnd + 1;
            }
        } else {
            const selectedText = viewUpdate.state.sliceDoc(selection.from, selection.to);
            setActiveQuery(selectedText);
        }
    };

    const handleRunQuery = async (queryToRun?: string) => {
        try {
            if (!queryToRun) {
                queryToRun = activeQuery || sqlQuery;
            }

            const queries = splitQueries(queryToRun);
            const results: QueryResult[] = [];

            for (const query of queries) {
                const response = await fetch(`${SERVER_URL}/api/query`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-ID': userId
                    },
                    body: JSON.stringify({ query }),
                });

                const result = await response.json();
                if (result.success) {
                    if (Array.isArray(result.data)) {
                        results.push({
                            query,
                            columns: Object.keys(result.data[0] || {}),
                            rows: result.data
                        });
                    } else {
                        results.push({
                            query,
                            columns: ['Changes', 'Last Insert Row ID'],
                            rows: [{
                                Changes: result.changes,
                                'Last Insert Row ID': result.lastInsertRowid
                            }]
                        });
                    }
                } else {
                    setQueryError(`Error in query "${query}": ${result.error}`);
                    break;
                }
            }

            if (results.length > 0) {
                setQueryResults(results);
                setQueryError(null);
                await fetchSchemaInfo(userId);
            }
        } catch (error) {
            setQueryError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setQueryResults([]);
        }
    };

    const handleResetDatabase = async () => {
        try {
            const response = await fetch(`${SERVER_URL}/api/reset`, {
                method: 'POST',
                headers: { 'X-User-ID': userId }
            });
            const result = await response.json();
            if (result.success) {
                setQueryError('Database reset successfully. You now have a fresh database.');
                setQueryResults([]);
                fetchSchemaInfo(userId);
            } else {
                setQueryError(`Error resetting database: ${result.error}`);
            }
        } catch (error) {
            setQueryError(`Error resetting database: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleNewDatabase = () => {
        const newUserId = uuidv4();
        localStorage.setItem('sqlSandboxUserId', newUserId);
        setUserId(newUserId);
        setSandboxUrl(`${window.location.origin}/sandbox/${newUserId}`);
        fetchSchemaInfo(newUserId);
        setQueryError('New database created. You can start with a fresh database.');
        setQueryResults([]);
        window.location.href = `/sandbox/${newUserId}`;
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(sandboxUrl)
        alert('Sandbox URL copied to clipboard!')
    }

    const renderTableData = (tableInfo: SchemaInfo[string]) => {
        if (!tableInfo || !tableInfo.data || !Array.isArray(tableInfo.data) || tableInfo.data.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={tableInfo?.columns?.length || 1} className="text-center">
                        No data available
                    </TableCell>
                </TableRow>
            );
        }

        return tableInfo.data.map((row, index) => (
            <TableRow key={index}>
                {tableInfo.columns.map(col => (
                    <TableCell key={col.name}>
                        {row[col.name] !== undefined ? String(row[col.name]) : 'N/A'}
                    </TableCell>
                ))}
            </TableRow>
        ));
    };

    const sqlKeywords = [
        'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER',
        'INDEX', 'VIEW', 'TRIGGER', 'PROCEDURE', 'FUNCTION', 'DATABASE', 'SCHEMA', 'GRANT', 'REVOKE',
        'COMMIT', 'ROLLBACK', 'TRANSACTION', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'FULL',
        'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET', 'UNION', 'INTERSECT', 'EXCEPT'
    ]

    const myCompletions = (context: CompletionContext) => {
        const before = context.matchBefore(/\w+/);
        if (!context.explicit && !before) return null;

        let options: Completion[] = [];
        options = options.concat(sqlKeywords.map(keyword => ({ label: keyword, type: "keyword" })));

        if (schemaInfo) {
            options = options.concat(Object.keys(schemaInfo).map(tableName => ({
                label: tableName,
                type: "table"
            })));

            const matchedTable = Object.keys(schemaInfo).find(tableName =>
                context.state.doc.sliceString(0, context.pos).includes(tableName)
            );
            if (matchedTable) {
                options = options.concat(schemaInfo[matchedTable].columns.map(col => ({
                    label: col.name,
                    type: "field"
                })));
            }
        }

        return {
            from: before ? before.from : context.pos,
            options: options,
            validFor: /^\w*$/
        };
    };

    return (
        <div className="container mx-auto p-2 sm:p-4">
            <Card className="mb-4">
                <CardHeader>
                    <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <span className="mb-2 sm:mb-0">Database Schema</span>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={autoRefresh}
                                    onCheckedChange={setAutoRefresh}
                                    id="auto-refresh"
                                />
                                <label htmlFor="auto-refresh" className="text-sm">Auto Refresh</label>
                            </div>
                            <Button onClick={handleManualRefresh} size="sm" className="w-full sm:w-auto">
                                <RefreshCw className="mr-2 h-4 w-4" /> Refresh Now
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {lastRefreshTime && (
                        <p className="text-sm text-gray-500 mb-2">
                            Last refreshed: {lastRefreshTime.toLocaleTimeString()}
                        </p>
                    )}
                    {fetchError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <span className="block sm:inline">{fetchError}</span>
                        </div>
                    )}
                    {schemaInfo && Object.keys(schemaInfo).length > 0 ? (
                        <Tabs value={activeTable || ''} onValueChange={setActiveTable}>
                            <TabsList className="flex flex-wrap mb-4">
                                {Object.keys(schemaInfo).map(tableName => (
                                    <TabsTrigger
                                        key={tableName}
                                        value={tableName}
                                        className="flex-grow text-center px-2 py-1 truncate text-xs sm:text-sm"
                                    >
                                        {tableName}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            {Object.entries(schemaInfo).map(([tableName, tableInfo]) => (
                                <TabsContent key={tableName} value={tableName}>
                                    <div className="border rounded-lg overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        {tableInfo.columns.map(col => (
                                                            <TableHead key={col.name} className="bg-gray-100 sticky top-0 text-xs sm:text-sm">
                                                                {col.name} ({col.type})
                                                            </TableHead>
                                                        ))}
                                                    </TableRow>
                                                </TableHeader>
                                            </Table>
                                        </div>
                                        <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                                            <Table>
                                                <TableBody>
                                                    {renderTableData(tableInfo)}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-xs sm:text-sm text-gray-500">
                                        Showing {tableInfo.data.length} of {tableInfo.totalRows} rows
                                    </p>
                                </TabsContent>
                            ))}
                        </Tabs>
                    ) : (
                        <p>No tables found in the database.</p>
                    )}
                </CardContent>
            </Card>
            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>SQL Sandbox</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <label htmlFor="sqlQuery" className="block text-sm font-medium text-gray-700 mb-2">
                            Enter your SQL queries (separate multiple queries with semicolons):
                        </label>
                        <label className="block text-sm font-small text-gray-700 mb-2">
                            <span className="bg-yellow-200/50 italic">Put cursor in query you want to run.</span>
                        </label>
                        <CodeMirror
                            value={sqlQuery}
                            height="150px"
                            extensions={[sql(), autocompletion({ override: [myCompletions] })]}
                            onChange={handleEditorChange}
                            onUpdate={handleCursorActivity}
                            className="border rounded text-sm"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            {activeQuery ? 'Active query: ' + activeQuery : 'No query selected'}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                        <Button onClick={() => handleRunQuery()} className="w-full sm:w-auto">
                            <Play className="mr-2 h-4 w-4" />
                            Run {activeQuery ? 'Selected' : 'All'} Query
                        </Button>
                        <Button onClick={handleResetDatabase} variant="outline" className="w-full sm:w-auto">
                            <RefreshCw className="mr-2 h-4 w-4" /> Reset Database
                        </Button>
                        <Button onClick={handleNewDatabase} variant="outline" className="w-full sm:w-auto">
                            Create New Database
                        </Button>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">Query Results:</h3>
                        {queryError && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                                <span className="block sm:inline">{queryError}</span>
                            </div>
                        )}
                        {queryResults.map((result, index) => (
                            <div key={index} className="mb-6">
                                <div className="bg-gray-100 p-2 rounded mb-2">
                                    <code className="text-sm">{result.query}</code>
                                </div>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                {result.columns.map((column, colIndex) => (
                                                    <TableHead key={colIndex} className="text-xs sm:text-sm">
                                                        {column}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {result.rows.map((row, rowIndex) => (
                                                <TableRow key={rowIndex}>
                                                    {result.columns.map((column, colIndex) => (
                                                        <TableCell key={colIndex} className="text-xs sm:text-sm">
                                                            {String(row[column])}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Share Your Sandbox</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                        <Input value={sandboxUrl} readOnly className="w-full sm:flex-grow" />
                        <Button onClick={copyToClipboard} className="w-full sm:w-auto flex items-center justify-center">
                            <Copy className="mr-2 h-4 w-4" /> Copy
                        </Button>
                    </div>
                    <div className="flex items-start space-x-2 text-yellow-600">
                        <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <p className="text-xs sm:text-sm">
                            Note: This link provides access to your sandbox. Share it only with those you want to have access.
                        </p>
                    </div>
                </CardContent>
            </Card>
            <p className="text-xs sm:text-sm text-gray-300" style={{ textAlign: 'center', paddingTop: '3px' }}>
                <a href="https://evensonlabs.com">built by evensonlabs.com</a>
            </p>
        </div>
    );
}