import {defineField, defineType} from 'sanity'

// Customer reviews. The website sends each new review to Sanity as a DRAFT, which the public
// site cannot see. Publishing a review is what makes it appear on the website.
export const reviewType = defineType({
  name: 'review',
  title: 'Customer Review',
  type: 'document',
  description:
    'New reviews arrive as drafts and are NOT visible on the website. Read the review, then click Publish to show it. ' +
    'Publish every genuine review, good or bad. Only leave a review unpublished if it is spam, abusive, off topic, ' +
    'or shows personal details such as a phone number or address. Never delete or hide a review just because it is negative.',
  fields: [
    defineField({
      name: 'product',
      title: 'Product',
      type: 'reference',
      to: [{type: 'product'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'rating',
      title: 'Rating (1 to 5)',
      type: 'number',
      validation: (rule) => rule.required().integer().min(1).max(5),
    }),
    defineField({name: 'title', title: 'Review title', type: 'string', validation: (rule) => rule.max(80)}),
    defineField({
      name: 'body',
      title: 'Review',
      type: 'text',
      rows: 5,
      description: "The customer's own words. Only edit this to remove personal details.",
      validation: (rule) => rule.required().max(1500),
    }),
    defineField({
      name: 'displayName',
      title: 'Name shown on the website',
      type: 'string',
      description: 'First name and last initial, for example Sandra M.',
      validation: (rule) => rule.required().max(40),
    }),
    defineField({name: 'location', title: 'Location (optional)', type: 'string', validation: (rule) => rule.max(40)}),
    defineField({
      name: 'verifiedPurchase',
      title: 'Verified purchase',
      type: 'boolean',
      initialValue: false,
      description: 'Turn on ONLY if you have checked that this person bought this piece from SheLoveDiamonds.',
    }),
    defineField({
      name: 'featured',
      title: 'Show on the homepage',
      type: 'boolean',
      initialValue: false,
      description: 'Featured reviews are shown first on the homepage. Only genuine, published reviews can be featured.',
    }),
    defineField({
      name: 'ownerReply',
      title: 'Reply from SheLoveDiamonds (optional)',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.max(600),
    }),
    defineField({name: 'submittedAt', title: 'Submitted at', type: 'datetime', readOnly: true}),
  ],
  preview: {
    select: {name: 'displayName', rating: 'rating', productName: 'product.name', body: 'body'},
    prepare({name, rating, productName, body}) {
      const stars = '★'.repeat(Number(rating) || 0)
      return {
        title: `${name || 'Customer'}  ${stars}`,
        subtitle: `${productName || 'Product'}: ${(body || '').slice(0, 70)}`,
      }
    },
  },
})
