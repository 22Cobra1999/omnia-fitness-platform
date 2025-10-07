"use server"

export async function testDatabaseConnection() {
  try {
    // Simple test to check if the database connection works
    const response = await fetch(`/api/test-db`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error testing database connection:", error)
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}

export async function runDatabaseMigration(migrationName: string) {
  try {
    const response = await fetch(`/api/admin/run-migration`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ migration: migrationName }),
    })

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error running migration:", error)
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
    }
  }
}
