'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Copy, Mail, RefreshCw } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import CodeMirror from '@uiw/react-codemirror'
import { sql } from '@codemirror/lang-sql'
import { autocompletion } from '@codemirror/autocomplete'
import { CompletionContext, Completion } from '@codemirror/autocomplete'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001'
console.log('SERVER_URL:', SERVER_URL);

interface SchemaInfo {
    [tableName: string]: {
        columns: { name: string; type: string }[];
        data: Record<string, unknown>[];
        totalRows: number;
    };
}

interface QueryResult {
    columns: string[];
    rows: Record<string, unknown>[];
}

export default function SQLSandbox() {
    const [userId, setUserId] = useState('')
    const [sqlQuery, setSqlQuery] = useState('')
    const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
    const [queryError, setQueryError] = useState<string | null>(null)
    const [sandboxUrl, setSandboxUrl] = useState('')
    const [schemaInfo, setSchemaInfo] = useState<SchemaInfo | null>(null)
    const [fetchError, setFetchError] = useState<string | null>(null)
    const [autoRefresh, setAutoRefresh] = useState(false)
    const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)
    const [activeTable, setActiveTable] = useState<string | null>(null)

    const fetchSchemaInfo = useCallback(async (id: string) => {
        try {
            const response = await fetch(`${SERVER_URL}/api/schema`, {
                headers: { 'X-User-ID': id }
            })
            const result = await response.json()
            if (result.success) {
                setSchemaInfo(result.data)
                setFetchError(null)
                setLastRefreshTime(new Date())
                // Set active table if not already set or if current active table no longer exists
                if (!activeTable || !result.data[activeTable]) {
                    const tables = Object.keys(result.data)
                    if (tables.length > 0) {
                        setActiveTable(tables[0])
                    } else {
                        setActiveTable(null)
                    }
                }
            } else {
                setFetchError(`Failed to fetch schema: ${result.error}`)
                console.error('Failed to fetch schema:', result.error)
            }
        } catch (error) {
            if (error instanceof Error) {
                setFetchError(`Error fetching schema: ${error.message}`)
                console.error('Error fetching schema:', error)
            } else {
                setFetchError('An unknown error occurred while fetching schema')
                console.error('Unknown error fetching schema:', error)
            }
        }
    }, [activeTable])

    useEffect(() => {
        const storedUserId = localStorage.getItem('sqlSandboxUserId')
        const newUserId = storedUserId || uuidv4()
        if (!storedUserId) {
            localStorage.setItem('sqlSandboxUserId', newUserId)
        }
        setUserId(newUserId)
        setSandboxUrl(`${window.location.origin}/sandbox/${newUserId}`)
        fetchSchemaInfo(newUserId)
    }, [fetchSchemaInfo])

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;
        if (autoRefresh) {
            intervalId = setInterval(() => {
                fetchSchemaInfo(userId)
            }, 5000) // Refresh every 5 seconds
        }
        return () => {
            if (intervalId) clearInterval(intervalId)
        }
    }, [autoRefresh, userId, fetchSchemaInfo])

    const handleManualRefresh = () => {
        fetchSchemaInfo(userId)
    }

    // const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    //     setSqlQuery(e.target.value)
    // }

    const handleRunQuery = async () => {
        try {
            const response = await fetch(`${SERVER_URL}/api/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': userId
                },
                body: JSON.stringify({ query: sqlQuery }),
            })
            const result = await response.json()
            if (result.success) {
                if (Array.isArray(result.data)) {
                    setQueryResult({
                        columns: Object.keys(result.data[0] || {}),
                        rows: result.data
                    })
                } else {
                    setQueryResult({
                        columns: ['Changes', 'Last Insert Row ID'],
                        rows: [{ Changes: result.changes, 'Last Insert Row ID': result.lastInsertRowid }]
                    })
                }
                setQueryError(null)
                // Refresh schema after running a query
                await fetchSchemaInfo(userId)
            } else {
                setQueryError(`Error: ${result.error}`)
                setQueryResult(null)
            }
        } catch (error) {
            if (error instanceof Error) {
                setQueryError(`Error: ${error.message}`)
            } else {
                setQueryError('An unknown error occurred')
            }
            setQueryResult(null)
        }
    }

    const handleResetDatabase = async () => {
        try {
            const response = await fetch(`${SERVER_URL}/api/reset`, {
                method: 'POST',
                headers: { 'X-User-ID': userId }
            })
            const result = await response.json()
            if (result.success) {
                setQueryError('Database reset successfully. You now have a fresh database.')
                setQueryResult(null)
                fetchSchemaInfo(userId)
            } else {
                setQueryError(`Error resetting database: ${result.error}`)
            }
        } catch (error) {
            if (error instanceof Error) {
                setQueryError(`Error resetting database: ${error.message}`)
            } else {
                setQueryError('An unknown error occurred while resetting the database')
            }
        }
    }

    const handleNewDatabase = () => {
        const newUserId = uuidv4()
        localStorage.setItem('sqlSandboxUserId', newUserId)
        setUserId(newUserId)
        const newSandboxUrl = `${window.location.origin}/sandbox/${newUserId}`
        setSandboxUrl(newSandboxUrl)
        fetchSchemaInfo(newUserId)
        setQueryError('New database created. You can start with a fresh database.')
        setQueryResult(null)
        window.location.href = newSandboxUrl
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(sandboxUrl)
        alert('Sandbox URL copied to clipboard!')
    }

    const emailSandboxUrl = () => {
        window.location.href = `mailto:?subject=SQL Sandbox Link&body=Here's your SQL Sandbox link: ${sandboxUrl}`
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
        const before = context.matchBefore(/\w+/)
        if (!context.explicit && !before) return null
        
        let options: Completion[] = []

        // Add SQL keywords
        options = options.concat(sqlKeywords.map(keyword => ({ label: keyword, type: "keyword" })))

        // Add table names
        if (schemaInfo) {
            options = options.concat(Object.keys(schemaInfo).map(tableName => ({ label: tableName, type: "table" })))

            // Add column names if a table is selected
            const matchedTable = Object.keys(schemaInfo).find(tableName =>
                context.state.doc.sliceString(0, context.pos).includes(tableName)
            )
            if (matchedTable) {
                options = options.concat(schemaInfo[matchedTable].columns.map(col => ({ label: col.name, type: "field" })))
            }
        }

        return {
            from: before ? before.from : context.pos,
            options: options,
            validFor: /^\w*$/
        }
    }

    return (
        <div className="container mx-auto p-4">
            <Card className="mb-4">
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>Database Schema</span>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={autoRefresh}
                                    onCheckedChange={setAutoRefresh}
                                    id="auto-refresh"
                                />
                                <label htmlFor="auto-refresh" className="text-sm">Auto Refresh</label>
                            </div>
                            <Button onClick={handleManualRefresh} size="sm">
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
                                        className="flex-grow text-center px-2 py-1 truncate"
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
                                                            <TableHead key={col.name} className="bg-gray-100 sticky top-0">
                                                                {col.name} ({col.type})
                                                            </TableHead>
                                                        ))}
                                                    </TableRow>
                                                </TableHeader>
                                            </Table>
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto">
                                            <Table>
                                                <TableBody>
                                                    {renderTableData(tableInfo)}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-500">
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
                            Enter your SQL query:
                        </label>
                        <CodeMirror
                            value={sqlQuery}
                            height="200px"
                            extensions={[sql(), autocompletion({ override: [myCompletions] })]}
                            onChange={(value) => setSqlQuery(value)}
                            className="border rounded"
                        />
                    </div>
                    <div className="flex space-x-2 mb-4">
                        <Button onClick={handleRunQuery}>Run Query</Button>
                        <Button onClick={handleResetDatabase} variant="outline">
                            <RefreshCw className="mr-2 h-4 w-4" /> Reset Database
                        </Button>
                        <Button onClick={handleNewDatabase} variant="outline">
                            Create New Database
                        </Button>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">Query Result:</h3>
                        {queryError && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                                <span className="block sm:inline">{queryError}</span>
                            </div>
                        )}
                        {queryResult && (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {queryResult.columns.map((column, index) => (
                                                <TableHead key={index}>{column}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {queryResult.rows.map((row, rowIndex) => (
                                            <TableRow key={rowIndex}>
                                                {queryResult.columns.map((column, colIndex) => (
                                                    <TableCell key={colIndex}>{String(row[column])}</TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Share Your Sandbox</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2 mb-4">
                        <Input value={sandboxUrl} readOnly className="flex-grow" />
                        <Button onClick={copyToClipboard} className="flex items-center">
                            <Copy className="mr-2 h-4 w-4" /> Copy
                        </Button>
                        <Button onClick={emailSandboxUrl} className="flex items-center">
                            <Mail className="mr-2 h-4 w-4" /> Email
                        </Button>
                    </div>
                    <div className="flex items-start space-x-2 text-yellow-600">
                        <AlertCircle className="h-5 w-5 mt-0.5" />
                        <p className="text-sm">
                            Note: This link provides access to your sandbox. Share it only with those you want to have access.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}