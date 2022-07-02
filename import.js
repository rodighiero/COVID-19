// Libraries

const fs = require('fs')
const csv = require('csv-parser')
const accents = require('remove-accents')
const stringify = require("json-stringify-pretty-compact")

// Time counter

const start = Date.now()

// Reading data

const results = []
fs.createReadStream('./data/metadata.csv').pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => parse(results))

// Parsing

const parse = records => {

    // Filtering and inversion

    records = records.reduce((records, record) => {

        record.authors = record.authors.split('; ')

        // Filter

        if (!record.abstract.includes('COVID-19') || !record.title.includes('COVID-19')) return records
        if (!record.doi) return records

        // Clean authors

        record.authors = record.authors.reduce((authors, author) => {
            let string = author
            string = string.normalize('NFC')
            string = `${string.split(', ')[1]} ${string.split(', ')[0]}`
            string = string.trim()
            string = accents.remove(string)
            string = string.replace(/\s\s+/g, ' ') // Replace multiple spaces
            string = string.replace('undefined ', '') // Clean names already switched
            // string = string.replace(/\./g, '') // remove dots
            string = string.replace(/\,/g, '') // remove commas

            // filter
            if (
                string.includes('039') ||
                string.includes('Direccion') ||
                string.includes('Ministerio') ||
                string == 'undefined'
            ) {
                console.log(string, 'removed')
                return authors
            }

            authors.push(string)
            return authors
        }, [])

        // Filter

        if (record.authors.length == 0) return records

        // Add

        records.push(record)
        return records

    }, [])

    // Grouping by author

    const authors = records
        // .slice(0, 1000) // Trim for testing
        .reduce((authors, record, i) => {

            if ((i % 1000) === 0) console.log('Grouping record #', records.length - i)

            const year = parseInt(record.publish_time.split('-')[0])
            const text = `${record.title} ${record.abstract} `

            // Create author

            const add = name => {
                authors.push({
                    id: authors.length,
                    name: name,
                    docs: 1,
                    years: { [year]: 1 },
                    peers: [],
                    text: text
                })
            }

            // Update author

            const update = (author) => {
                author.docs++
                author.text += text
                if (author.years[year]) (author.years[year])++
                else (author.years[year]) = 1
            }

            // Create and update choice

            record.authors.forEach(name => {
                const found = authors.find(a => a.name === name)
                if (found) update(found)
                else add(name)
            })

            return authors

        }, [])




    // Transform authors into ids

    records.forEach((record, i) => {

        if ((i % 1000) === 0)
            console.log('Setting peers for record #', records.length - i)

        const peers = authors.filter(author => {
            let flag = false

            if (record.authors.includes(author.name)) flag = true

            // author.variants.forEach(variant => {
            //     if (record.authors.includes(variant)) {
            //         flag = true
            //     }
            // })

            return flag
        })

        // console.log(peers)

        const ids = peers.map(author => author.id)

        peers.forEach(peer => {
            ids.forEach(id => {
                if (!peer.peers.includes(id)) peer.peers.push(id)
            })
        })

    })

    // Time end

    const end = Date.now()
    const d = new Date(end - start)
    console.log(`Time computed ${d.getUTCHours()}h ${d.getUTCMinutes()}m ${d.getUTCSeconds()}s ${d.getUTCMilliseconds()}ms`)

    // Write JSON

    fs.writeFile('./data/authors.json', stringify(authors, { maxLength: 200 }), err => {
        if (err) throw err
    })



}