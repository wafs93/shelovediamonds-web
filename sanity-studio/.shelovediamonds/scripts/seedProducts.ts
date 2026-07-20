import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2025-01-01'})

const products = [
  {
    id: 'abayo-infinity',
    name: 'Abayo Infinity Bracelet',
    slug: 'abayo-infinity-bracelet',
    category: 'Bracelets',
    badge: 'Bestseller',
    price: 179,
    shortDesc: 'Pave lab-grown diamonds. Infinity symbol. 18K gold plated sterling silver.',
    fullDesc: 'The Abayo Infinity Bracelet is a celebration of eternal love and feminine strength. Handcrafted from 18K gold plated sterling silver, each piece features a pave setting of lab-grown diamonds arranged in the infinity symbol — a reminder that she is limitless. Available in Rose Gold, White Gold, and Yellow Gold. Each bracelet arrives in our signature SheLoveDiamonds gift box, ready to be worn or gifted.',
    variants: ['Rose Gold', 'White Gold', 'Yellow Gold'],
    mainImage: 'images/abayo-rose.png',
    images: ['images/abayo-rose.png', 'images/abayo-white.png', 'images/abayo-yellow.png'],
    details: ['18K gold plated 925 sterling silver', 'Pave lab-grown diamonds', 'Infinity symbol design', 'Secure bangle clasp', 'Available in 3 gold tones', 'Gift box included'],
    shipping: 'Free UK shipping. Worldwide delivery available.',
    inStock: true,
    isPersonalised: false,
    stripeLink: 'https://buy.stripe.com/14A28t7849m92hX3secEw00'
  },
  {
    id: 'abayo-rainbow',
    name: 'Abayo Infinity Rainbow Bracelet',
    slug: 'abayo-infinity-rainbow-bracelet',
    category: 'Bracelets',
    badge: 'New',
    price: 120,
    shortDesc: 'Multicolour Moissanite rainbow infinity. Rose, White, or Yellow gold.',
    fullDesc: 'A vibrant celebration of colour and light. The Abayo Infinity Rainbow Bracelet features multicolour Moissanite stones set in the iconic infinity symbol — each stone catching the light differently, creating a rainbow effect that turns heads. Crafted from sterling silver in your choice of gold finish. The perfect statement piece for the woman who refuses to be ordinary.',
    variants: ['Rose Gold', 'White Gold', 'Yellow Gold'],
    mainImage: 'images/abayo-rainbow-rose.jpeg',
    images: ['images/abayo-rainbow-rose.jpeg', 'images/abayo-rainbow-white.jpeg', 'images/abayo-rainbow-yellow.jpeg'],
    details: ['18K gold plated 925 sterling silver', 'Multicolour Moissanite stones', 'Rainbow infinity design', 'Secure bangle clasp', 'Available in 3 gold tones', 'Gift box included'],
    shipping: 'Free UK shipping. Worldwide delivery available.',
    inStock: true,
    isPersonalised: false,
    stripeLink: 'https://buy.stripe.com/28E4gB2RO69X9Kp2oacEw01'
  },
  {
    id: 'name-bracelet',
    name: 'Personalised Name Bracelet',
    slug: 'personalised-name-bracelet',
    category: 'Personalised',
    badge: 'Personalise',
    price: 195,
    shortDesc: 'Your name. Diamond letters. Deep-engraved. Made for her.',
    fullDesc: "The most personal piece in our collection. Your name — or the name of someone you love — set in diamond-encrusted letters on a sleek sterling silver bracelet. Each piece is made to order. Please include the name you'd like in the order notes at checkout. Allow 5–7 working days for personalised pieces.",
    variants: ['Rose Gold', 'White Gold'],
    mainImage: 'images/name-bracelet.png',
    images: ['images/name-bracelet.png'],
    details: ['18K gold plated 925 sterling silver', 'Diamond-encrusted letter setting', 'Made to order — your name', 'Rose Gold or White Gold', 'Allow 5–7 working days', 'Gift box included'],
    shipping: 'Free UK shipping. Worldwide delivery available.',
    inStock: true,
    isPersonalised: true,
    stripeLink: 'https://buy.stripe.com/5kQkFeAwaqdf4J7IucEw02'
  },
  {
    id: 'shelove-cufflinks',
    name: 'Shelove Cufflinks',
    slug: 'shelove-cufflinks',
    category: 'Cufflinks',
    badge: 'New',
    price: 179,
    shortDesc: 'Personalised Initial Cufflinks. Stainless steel plated in gold with lab-grown diamonds.',
    fullDesc: 'These cufflinks combine durability, comfort, and timeless elegance. Fully customizable with any initial of your choice — the perfect gift for groomsmen, fathers, husbands, or yourself. Timeless. Personal. Brilliant.',
    variants: ['Round Face', 'Square Face'],
    mainImage: 'images/cufflinks-silver.jpeg',
    images: ['images/cufflinks-silver.jpeg', 'images/cufflinks-variants.jpeg'],
    details: ['Stainless steel plated in gold', 'High-quality lab-grown diamonds in full pave setting', 'Round face with customizable initial', 'Polished gold plating', 'Gift box included'],
    shipping: 'Free UK shipping. Worldwide delivery available.',
    inStock: true,
    isPersonalised: true,
    stripeLink: ''
  },
  {
    id: 'abayo-rainbow-earrings',
    name: 'ABAYO Rainbow Infinity Earrings',
    slug: 'abayo-rainbow-earrings',
    category: 'Earrings',
    badge: 'New',
    price: 0,
    shortDesc: 'Gold plated stainless steel with multicoloured Moissanite. Iconic infinity symbol stud earrings.',
    fullDesc: 'Add a burst of vibrant color and timeless symbolism to your look. These stunning stud earrings feature the iconic infinity symbol fully pave-set with a dazzling spectrum of multicolored Moissanite stones, creating a joyful rainbow effect that sparkles from every angle.',
    variants: ['Rose Gold'],
    mainImage: 'images/earrings-rainbow.jpeg',
    images: ['images/earrings-rainbow.jpeg'],
    details: ['Stainless steel plated in gold', 'Multicolored Moissanite in full rainbow pave setting', 'Iconic infinity symbol design', 'Modern stud with secure post backing', 'Polished gold plating', 'Gift box included'],
    shipping: 'Free UK shipping. Worldwide delivery available.',
    inStock: true,
    isPersonalised: false,
    stripeLink: ''
  }
]

async function run() {
  const tx = client.transaction()

  products.forEach((product) => {
    tx.createOrReplace({
      _id: `product.${product.slug}`,
      _type: 'product',
      productId: product.id,
      name: product.name,
      slug: {
        _type: 'slug',
        current: product.slug,
      },
      category: product.category,
      badge: product.badge,
      price: product.price,
      shortDesc: product.shortDesc,
      fullDesc: product.fullDesc,
      variants: product.variants,
      mainImage: product.mainImage,
      images: product.images,
      details: product.details,
      shipping: product.shipping,
      inStock: product.inStock,
      isPersonalised: product.isPersonalised,
      stripeLink: product.stripeLink,
    })
  })

  await tx.commit()

  const imported = await client.fetch('*[_type == "product"]{name, "slug": slug.current} | order(name asc)')
  console.log(`Imported ${products.length} products`) 
  console.log(JSON.stringify(imported, null, 2))
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
