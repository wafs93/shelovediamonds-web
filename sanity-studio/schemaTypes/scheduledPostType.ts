import {defineField, defineType} from 'sanity'

export const scheduledPostType = defineType({
  name: 'scheduledPost',
  title: 'Scheduled Post',
  type: 'document',
  fields: [
    defineField({name: 'product', title: 'Product', type: 'reference', to: [{type: 'product'}]}),
    defineField({name: 'productName', title: 'Product Name', type: 'string'}),
    defineField({name: 'caption', title: 'Caption', type: 'text', rows: 6}),
    defineField({name: 'imageUrl', title: 'Image URL', type: 'url'}),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {list: ['draft', 'approved', 'posted']},
      initialValue: 'draft',
    }),
    defineField({name: 'generatedAt', title: 'Generated At', type: 'datetime'}),
  ],
  preview: {
    select: {title: 'productName', subtitle: 'status'},
  },
})
