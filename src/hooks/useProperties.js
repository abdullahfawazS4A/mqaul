import { useData } from '../data/DataContext.jsx'

/**
 * واجهة العقارات — بيانات العقار في localStorage، ومحتوى مستنداته
 * (الصور وملفات PDF) في IndexedDB عبر data/files.js.
 */
export function useProperties() {
  const {
    properties,
    getProperty,
    addProperty,
    updateProperty,
    deleteProperty,
    addPropertyDocument,
    deletePropertyDocument,
    propertiesTotals,
  } = useData()

  return {
    properties,
    getProperty,
    addProperty,
    updateProperty,
    deleteProperty,
    addPropertyDocument,
    deletePropertyDocument,
    propertiesTotals,
  }
}
