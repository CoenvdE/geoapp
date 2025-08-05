import { useState, useEffect } from 'react'
import { supabase, PersonInformation } from '@/lib/supabase'

interface EditData {
  first_name: string
  last_name: string
  latitude: string
  longitude: string
}

export function usePersonManagement() {
  const [persons, setPersons] = useState<PersonInformation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingPerson, setEditingPerson] = useState<number | null>(null)
  const [editData, setEditData] = useState<EditData>({
    first_name: "",
    last_name: "",
    latitude: "",
    longitude: ""
  })

  const fetchPersons = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('person_information')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setPersons(data || [])
    } catch (err) {
      console.error('Error fetching persons:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch persons')
    } finally {
      setLoading(false)
    }
  }

  const addPerson = async (personData: {
    first_name: string
    last_name: string
    latitude: number
    longitude: number
  }) => {
    try {
      const { error } = await supabase
        .from('person_information')
        .insert([personData])

      if (error) throw error
      
      // Refresh the list
      await fetchPersons()
      return { success: true }
    } catch (err) {
      console.error('Error adding person:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to add person' 
      }
    }
  }

  const updatePerson = async (personId: number, personData: {
    first_name: string
    last_name: string
    latitude: number
    longitude: number
  }) => {
    try {
      const { error } = await supabase
        .from('person_information')
        .update(personData)
        .eq('id', personId)

      if (error) throw error
      
      // Refresh the list
      await fetchPersons()
      return { success: true }
    } catch (err) {
      console.error('Error updating person:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update person' 
      }
    }
  }

  const deletePerson = async (personId: number) => {
    try {
      const { error } = await supabase
        .from('person_information')
        .delete()
        .eq('id', personId)

      if (error) throw error
      
      // Refresh the list
      await fetchPersons()
      return { success: true }
    } catch (err) {
      console.error('Error deleting person:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete person' 
      }
    }
  }

  const startEditing = (person: PersonInformation) => {
    setEditingPerson(person.id)
    setEditData({
      first_name: person.first_name,
      last_name: person.last_name,
      latitude: person.latitude.toString(),
      longitude: person.longitude.toString()
    })
  }

  const cancelEditing = () => {
    setEditingPerson(null)
    setEditData({
      first_name: "",
      last_name: "",
      latitude: "",
      longitude: ""
    })
  }

  const saveEdit = async () => {
    if (!editingPerson) return { success: false, error: 'No person being edited' }

    // Validate required fields
    if (!editData.first_name || !editData.last_name || !editData.latitude || !editData.longitude) {
      return { success: false, error: 'Please fill in all fields' }
    }

    // Validate latitude and longitude
    const lat = parseFloat(editData.latitude)
    const lng = parseFloat(editData.longitude)
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return { success: false, error: 'Latitude must be between -90 and 90' }
    }
    
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return { success: false, error: 'Longitude must be between -180 and 180' }
    }

    const result = await updatePerson(editingPerson, {
      first_name: editData.first_name.trim(),
      last_name: editData.last_name.trim(),
      latitude: lat,
      longitude: lng
    })

    if (result.success) {
      setEditingPerson(null)
      setEditData({
        first_name: "",
        last_name: "",
        latitude: "",
        longitude: ""
      })
    }

    return result
  }

  // Fetch persons on mount
  useEffect(() => {
    fetchPersons()
  }, [])

  return {
    // State
    persons,
    loading,
    error,
    editingPerson,
    editData,
    
    // Actions
    fetchPersons,
    addPerson,
    updatePerson,
    deletePerson,
    startEditing,
    cancelEditing,
    saveEdit,
    setEditData
  }
} 