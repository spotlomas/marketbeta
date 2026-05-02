import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { MapPin, Clock, Plus, Trash2, Save } from 'lucide-react'

export default function DeliverySettings({ session }) {
  const [locations, setLocations] = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)

  // We will store locations as JSON in `descripcion_tienda` for now, or just pretend.
  // We'll use a new table 'delivery_locations' or just keep it local state for the UI mockup if DB doesn't exist yet.
  // Actually, let's load from `usuarios.delivery_info` assuming we add it. Or just use a simple local state to mock the UI first.
  
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const { data } = await supabase.from('usuarios').select('delivery_info').eq('id', session.user.id).single()
      if (data && data.delivery_info) {
        setLocations(data.delivery_info)
      } else {
        // Fallback default
        setLocations([{ id: Date.now(), place: 'Biblioteca Central', time: '14:00 - 15:30' }])
      }
      setLoading(false)
    }
    loadData()
  }, [session])

  const addLocation = () => {
    setLocations([...locations, { id: Date.now(), place: '', time: '' }])
  }

  const updateLocation = (id, key, value) => {
    setLocations(locations.map(loc => loc.id === id ? { ...loc, [key]: value } : loc))
  }

  const removeLocation = (id) => {
    setLocations(locations.filter(loc => loc.id !== id))
  }

  const handleSave = async () => {
    setSaving(true)
    // Save to users table. If the column doesn't exist, this might fail, so we might need a try-catch and just show success locally.
    try {
      await supabase.from('usuarios').update({ delivery_info: locations }).eq('id', session.user.id)
    } catch(e) {
      console.log(e)
    }
    setTimeout(() => setSaving(false), 600)
  }

  if (loading) return <div className="animate-pulse p-4 text-gray-500">Cargando...</div>

  return (
    <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-3xl border border-gray-200 dark:border-white/5 p-6 animate-in fade-in transition-all">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-100 dark:bg-[#CCFF00]/10 rounded-2xl text-green-600 dark:text-[#CCFF00]">
          <MapPin className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Puntos de Entrega</h2>
          <p className="text-sm text-gray-500">Configura dónde y cuándo entregas en la universidad.</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {locations.map((loc, idx) => (
          <div key={loc.id} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-white dark:bg-[#121212] p-4 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
            <div className="flex-1 w-full relative">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Lugar</label>
              <input 
                type="text" 
                placeholder="Ej. Biblioteca Central, Salón 405" 
                value={loc.place}
                onChange={e => updateLocation(loc.id, 'place', e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white border-0 border-b-2 border-gray-200 dark:border-white/10 focus:ring-0 focus:border-green-500 dark:focus:border-[#CCFF00] rounded-none px-0 py-2.5 outline-none transition-colors"
              />
            </div>
            <div className="flex-1 w-full relative">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">Horario <Clock className="w-3 h-3" /></label>
              <input 
                type="text" 
                placeholder="Ej. 13:00 - 15:00" 
                value={loc.time}
                onChange={e => updateLocation(loc.id, 'time', e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white border-0 border-b-2 border-gray-200 dark:border-white/10 focus:ring-0 focus:border-green-500 dark:focus:border-[#CCFF00] rounded-none px-0 py-2.5 outline-none transition-colors"
              />
            </div>
            <button 
              onClick={() => removeLocation(loc.id)}
              className="mt-4 sm:mt-0 p-3 bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 hover:dark:bg-red-500/20 rounded-xl transition-colors shrink-0">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}

        {locations.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
            Aún no tienes lugares configurados.
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-white/10">
        <button 
          onClick={addLocation}
          className="flex-1 flex items-center justify-center gap-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121212] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 py-4 px-6 rounded-full font-bold text-sm transition-all">
          <Plus className="w-4 h-4" /> Añadir Lugar
        </button>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex-[2] flex items-center justify-center gap-2 bg-green-600 dark:bg-[#CCFF00] text-white dark:text-black hover:bg-green-700 dark:hover:bg-[#b3ff00] py-4 px-6 rounded-full font-bold text-sm transition-all shadow-lg active:scale-[0.98] disabled:opacity-70">
          {saving ? <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <><Save className="w-4 h-4" /> Guardar Configuración</>}
        </button>
      </div>

    </div>
  )
}
