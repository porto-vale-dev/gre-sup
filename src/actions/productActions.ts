'use server'

import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'
import { revalidatePath } from 'next/cache'

const productSchema = z.object({
  name: z.string().min(1, 'Nome do produto é obrigatório'),
  price: z.preprocess(
    (val) => String(val).replace(',', '.'),
    z.coerce.number().min(0.01, 'Preço deve ser maior que zero')
  ),
  description: z.string().optional(),
  image: z.instanceof(File)
    .refine(file => file.size > 0, 'Imagem é obrigatória.')
    .refine(file => file.size <= 5 * 1024 * 1024, `Tamanho máximo é 5MB.`)
    .refine(
      file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Apenas formatos .jpg, .png e .webp são suportados.'
    ),
})

export async function addProductAction(formData: FormData) {
  const rawData = {
    name: formData.get('name'),
    price: formData.get('price'),
    description: formData.get('description'),
    image: formData.get('image'),
  }

  const validatedFields = productSchema.safeParse(rawData)

  if (!validatedFields.success) {
    console.error(validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      message: 'Dados do formulário inválidos. Verifique os campos e tente novamente.',
    }
  }

  const { name, price, description, image } = validatedFields.data
  const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')

  // 1. Upload image to Supabase Storage
  const fileExt = image.name.split('.').pop()
  const fileName = `${slug}-${Date.now()}.${fileExt}`
  const filePath = `produtos/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('produtos')
    .upload(filePath, image)

  if (uploadError) {
    console.error('Upload Error:', uploadError)
    return {
      success: false,
      message: `Erro ao fazer upload da imagem: ${uploadError.message}`,
    }
  }

  // 2. Get public URL of the uploaded image
  const { data: publicUrlData } = supabase.storage
    .from('produtos')
    .getPublicUrl(filePath)
    
  if (!publicUrlData) {
     return {
      success: false,
      message: `Não foi possível obter a URL pública da imagem.`,
    }
  }

  const imageUrl = publicUrlData.publicUrl;


  // 3. Insert product data into the 'produtos' table
  const { error: insertError } = await supabase
    .from('produtos')
    .insert({
      name,
      slug,
      price,
      description,
      image: imageUrl,
    })

  if (insertError) {
    console.error('Insert Error:', insertError)
    // Attempt to delete the orphaned image if DB insert fails
    await supabase.storage.from('produtos').remove([filePath]);
    return {
      success: false,
      message: `Erro ao salvar o produto no banco de dados: ${insertError.message}`,
    }
  }

  revalidatePath('/lead-bank/admin/products')
  revalidatePath('/lead-bank')
  
  return {
    success: true,
    message: 'Produto adicionado com sucesso!',
  }
}

export async function deleteProduct(productId: string, imageUrl: string) {
    try {
        // Extract the file path from the full URL
        const url = new URL(imageUrl);
        const imagePath = url.pathname.split('/public/')[1];

        if (!imagePath) {
            throw new Error("Caminho da imagem inválido.");
        }

        // 1. Delete from storage
        const { error: storageError } = await supabase.storage.from('produtos').remove([imagePath]);
        if (storageError) {
            console.error("Erro ao deletar imagem do storage:", storageError.message);
            // Non-fatal, we can still try to delete the DB record
        }

        // 2. Delete from database
        const { error: dbError } = await supabase.from('produtos').delete().eq('id', productId);
        if (dbError) {
            throw dbError;
        }

        revalidatePath('/lead-bank/admin/products');
        revalidatePath('/lead-bank');

        return { success: true, message: 'Produto excluído com sucesso.' };
    } catch (error: any) {
        console.error("Erro ao excluir produto:", error.message);
        return { success: false, message: `Falha ao excluir o produto: ${error.message}` };
    }
}
