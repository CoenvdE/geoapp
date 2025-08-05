"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, FileText, Database, User, Edit, Trash2, Save, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { usePersonManagement } from "@/hooks/use-person-management"

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>("")
  
  // New state for manual input
  const [manualData, setManualData] = useState({
    first_name: "",
    last_name: "",
    latitude: "",
    longitude: ""
  })
  const [submittingManual, setSubmittingManual] = useState(false)
  const [manualStatus, setManualStatus] = useState<string>("")

  // Use the person management hook
  const {
    persons,
    loading: loadingPersons,
    editingPerson,
    editData,
    addPerson,
    deletePerson,
    startEditing,
    cancelEditing,
    saveEdit,
    setEditData
  } = usePersonManagement()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setUploadStatus("")
    }
  }

  // New handler for manual input changes
  const handleManualInputChange = (field: string, value: string) => {
    setManualData(prev => ({
      ...prev,
      [field]: value
    }))
    setManualStatus("")
  }

  // New handler for manual form submission
  const handleManualSubmit = async () => {
    // Validate required fields
    if (!manualData.first_name || !manualData.last_name || !manualData.latitude || !manualData.longitude) {
      setManualStatus("❌ Please fill in all fields")
      return
    }

    // Validate latitude and longitude
    const lat = parseFloat(manualData.latitude)
    const lng = parseFloat(manualData.longitude)
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setManualStatus("❌ Latitude must be between -90 and 90")
      return
    }
    
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setManualStatus("❌ Longitude must be between -180 and 180")
      return
    }

    setSubmittingManual(true)
    setManualStatus("Saving person information...")

    const result = await addPerson({
      first_name: manualData.first_name.trim(),
      last_name: manualData.last_name.trim(),
      latitude: lat,
      longitude: lng
    })

    if (result.success) {
      setManualStatus("✅ Person information saved successfully!")
      // Clear the form
      setManualData({
        first_name: "",
        last_name: "",
        latitude: "",
        longitude: ""
      })
    } else {
      setManualStatus(`❌ Save failed: ${result.error}`)
    }
    
    setSubmittingManual(false)
  }

  const handleSaveEdit = async () => {
    const result = await saveEdit()
    if (!result.success) {
      // You could show an error message here if needed
      console.error('Edit failed:', result.error)
    }
  }

  const handleDeletePerson = async (personId: number) => {
    if (!confirm('Are you sure you want to delete this person?')) return

    const result = await deletePerson(personId)
    if (!result.success) {
      console.error('Delete failed:', result.error)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadStatus("Processing file...")

    try {
      // For CSV files, we'll parse and upload to Supabase
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const text = await file.text()
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        
        // Parse CSV data
        const data = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',')
            const row: any = {}
            headers.forEach((header, index) => {
              row[header] = values[index]?.trim()
            })
            return row
          })

        setUploadStatus(`Uploading ${data.length} records...`)

        // Upload to Supabase person_information table
        const { error } = await supabase
          .from('person_information')
          .insert(data.map(row => ({
            first_name: row.first_name || row['First Name'] || '',
            last_name: row.last_name || row['Last Name'] || '',
            latitude: parseFloat(row.latitude || row.Latitude || '0'),
            longitude: parseFloat(row.longitude || row.Longitude || '0')
          })))

        if (error) throw error

        setUploadStatus(`✅ Successfully uploaded ${data.length} records!`)
        // Refresh the persons list
        // Note: The hook will automatically refresh when data changes
      } else {
        setUploadStatus("❌ Please upload a CSV file")
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Upload Data</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Manual Input Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Add Person Manually
            </CardTitle>
            <CardDescription>
              Enter person information directly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="first-name" className="text-sm font-medium">
                First Name
              </label>
              <Input
                id="first-name"
                type="text"
                placeholder="Enter first name"
                value={manualData.first_name}
                onChange={(e) => handleManualInputChange('first_name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="last-name" className="text-sm font-medium">
                Last Name
              </label>
              <Input
                id="last-name"
                type="text"
                placeholder="Enter last name"
                value={manualData.last_name}
                onChange={(e) => handleManualInputChange('last_name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="latitude" className="text-sm font-medium">
                Latitude
              </label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="e.g., 40.7128"
                value={manualData.latitude}
                onChange={(e) => handleManualInputChange('latitude', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="longitude" className="text-sm font-medium">
                Longitude
              </label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="e.g., -74.0060"
                value={manualData.longitude}
                onChange={(e) => handleManualInputChange('longitude', e.target.value)}
              />
            </div>

            <Button 
              onClick={handleManualSubmit} 
              disabled={submittingManual}
              className="w-full"
            >
              {submittingManual ? "Saving..." : "Save Person"}
              <Database className="ml-2 h-4 w-4" />
            </Button>

            {manualStatus && (
              <div className="p-3 rounded-md bg-muted">
                <p className="text-sm">{manualStatus}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Existing CSV Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV Data
            </CardTitle>
            <CardDescription>
              Upload multiple people from CSV format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="file-upload" className="text-sm font-medium">
                Select CSV File
              </label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
              />
            </div>

            {file && (
              <div className="p-3 bg-muted rounded-md">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  <span>{file.name}</span>
                  <span className="text-muted-foreground">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              </div>
            )}

            <Button 
              onClick={handleUpload} 
              disabled={!file || uploading}
              className="w-full"
            >
              {uploading ? "Uploading..." : "Upload to Database"}
              <Database className="ml-2 h-4 w-4" />
            </Button>

            {uploadStatus && (
              <div className="p-3 rounded-md bg-muted">
                <p className="text-sm">{uploadStatus}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requirements Card */}
        <Card>
          <CardHeader>
            <CardTitle>Data Format Requirements</CardTitle>
            <CardDescription>
              CSV format requirements for bulk upload
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="font-medium">Required columns:</div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><code>first_name</code> or <code>First Name</code> - Person's first name</li>
                <li><code>last_name</code> or <code>Last Name</code> - Person's last name</li>
                <li><code>latitude</code> or <code>Latitude</code> - Decimal latitude</li>
                <li><code>longitude</code> or <code>Longitude</code> - Decimal longitude</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Person Management Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Manage Person Information
          </CardTitle>
          <CardDescription>
            View, edit, and remove existing person records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPersons ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Loading persons...</p>
            </div>
          ) : persons.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No persons found. Add some using the form above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {persons.map((person) => (
                <div key={person.id} className="border rounded-lg p-4 space-y-3">
                  {editingPerson === person.id ? (
                    // Edit mode
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">First Name</label>
                          <Input
                            value={editData.first_name}
                            onChange={(e) => setEditData(prev => ({ ...prev, first_name: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Last Name</label>
                          <Input
                            value={editData.last_name}
                            onChange={(e) => setEditData(prev => ({ ...prev, last_name: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Latitude</label>
                          <Input
                            type="number"
                            step="any"
                            value={editData.latitude}
                            onChange={(e) => setEditData(prev => ({ ...prev, latitude: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Longitude</label>
                          <Input
                            type="number"
                            step="any"
                            value={editData.longitude}
                            onChange={(e) => setEditData(prev => ({ ...prev, longitude: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit}>
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditing}>
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">
                            {person.first_name} {person.last_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Lat: {person.latitude}, Lng: {person.longitude}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Added: {new Date(person.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEditing(person)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeletePerson(person.id)}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 