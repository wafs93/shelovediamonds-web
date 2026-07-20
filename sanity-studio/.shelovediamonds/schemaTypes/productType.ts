import {defineField, defineType} from 'sanity'

export const productType = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({name: 'productId', title: 'Product ID', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'name', maxLength: 96}, validation: (rule) => rule.required()}),
    defineField({name: 'category', title: 'Category', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'badge', title: 'Badge', type: 'string'}),
    defineField({name: 'price', title: 'Price', type: 'number', validation: (rule) => rule.required().min(0)}),
    defineField({name: 'shortDesc', title: 'Short Description', type: 'text', rows: 3}),
    defineField({name: 'fullDesc', title: 'Full Description', type: 'text', rows: 6}),
    defineField({name: 'variants', title: 'Variants', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'mainImage', title: 'Main Image URL', type: 'url'}),
    defineField({name: 'images', title: 'Image URLs', type: 'array', of: [{type: 'url'}]}),
    defineField({name: 'details', title: 'Details', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'shipping', title: 'Shipping', type: 'string'}),
    defineField({name: 'inStock', title: 'In Stock', type: 'boolean', initialValue: true}),
    defineField({name: 'isPersonalised', title: 'Is Personalised', type: 'boolean'}),
    defineField({name: 'stripeLink', title: 'Stripe Link', type: 'url'})
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'category'
    }
  }
})