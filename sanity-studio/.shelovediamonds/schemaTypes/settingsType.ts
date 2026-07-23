import {defineField, defineType} from 'sanity'

export const settingsType = defineType({
  name: 'settings',
  title: 'Posting Schedule Settings',
  type: 'document',
  fields: [
    defineField({name: 'enabled', title: 'Auto-Posting Enabled', type: 'boolean', initialValue: false}),
    defineField({
      name: 'days',
      title: 'Posting Days',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Monday', value: 'monday'},
          {title: 'Tuesday', value: 'tuesday'},
          {title: 'Wednesday', value: 'wednesday'},
          {title: 'Thursday', value: 'thursday'},
          {title: 'Friday', value: 'friday'},
          {title: 'Saturday', value: 'saturday'},
          {title: 'Sunday', value: 'sunday'},
        ],
      },
    }),
    defineField({
      name: 'time',
      title: 'Posting Time (24h, Europe/London)',
      type: 'string',
      description: 'Format HH:MM, e.g. 10:00',
    }),
    defineField({name: 'updatedAt', title: 'Last Updated', type: 'datetime'}),
  ],
  preview: {
    select: {enabled: 'enabled', time: 'time'},
    prepare({enabled, time}) {
      return {
        title: 'Instagram Posting Schedule',
        subtitle: enabled ? `Enabled — ${time || 'no time set'}` : 'Disabled',
      }
    },
  },
})
