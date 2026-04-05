export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', 'messmate')
  formData.append('cloud_name', 'diibafnhh')

  const response = await fetch(
    'https://api.cloudinary.com/v1_1/diibafnhh/image/upload',
    { method: 'POST', body: formData }
  )
  const data = await response.json()
  return data.secure_url
}