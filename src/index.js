// CSS

import '../node_modules/css-reset-and-normalize/css/reset-and-normalize.min.css'
import './assets/main.css'

// Libraries

import { json, xml, image, extent, scaleLinear } from 'd3'
import { Application, BitmapFont, Texture } from 'pixi.js'
import { Viewport } from 'pixi-viewport'

// Assets

import background from './draw/background'
import clusters from './draw/clusters.js'
import contours from './draw/contours.js'
import links from './draw/links.js'
import keywords_close from './draw/keywords_close.js'
import keywords_distant from './draw/keywords_distant.js'
import nodes from './draw/nodes.js'

import fps from './interface/fps.js'
import search from './interface/search'
import stats from './interface/stats'

import fontXML from './assets/Lato.fnt'
import fontPNG from './assets/Lato.png'

import award from './assets/DHAwards2020-viz.png'

import linksJSON from './data/links.json'
import nodesJSON from './data/nodes.json'
import tripletsJSON from './data/triplets.json'

// Global variables

window.s = {
    distance: 30,
    links,
    nodes,
    tokens: []
}

// Start

Promise.all([
    json(linksJSON),
    json(nodesJSON),
    json(tripletsJSON),
    xml(fontXML),
    image(fontPNG),
    image(award),

]).then(([linksData, nodesData, tripletsData, xml, png, award]) => {

    // Append award

    document.getElementById('award').append(award)


    // Stats

    s.links = linksData; console.log('links', s.links.length)
    s.nodes = nodesData; console.log('nodes', s.nodes.length)
    s.triplets = tripletsData; console.log('triplets', s.triplets.length)

    // Set App

    s.app = new Application({
        width: window.innerWidth, height: window.innerHeight,
        antialias: true,
        resolution: 2,
        autoDensity: true,
        autoResize: true,
        resizeTo: window
    })
    document.body.prepend(s.app.view)

    // Create and append viewport

    s.viewport = new Viewport({
        screenWidth: window.innerWidth, screenHeight: window.innerHeight,
        interaction: s.app.renderer.plugins.interaction
    })
    s.app.stage.addChild(s.viewport)

    // Set scales

    const extX = extent(s.nodes, d => d.x)
    const extY = extent(s.nodes, d => d.y)
    const width = extX[1] - extX[0]
    const height = extY[1] - extY[0]
    const scaleX = window.innerWidth / width
    const scaleY = window.innerHeight / height

    // Scale for saving PNG

    const printing = false
    let scale = scaleX < scaleY ? scaleX : scaleY
    scale = printing ? scale * 10 : scale

    // Zoom Min and Max

    s.zoomMin = scale * .9 // reduction is to create a margin
    s.zoomMax = 4

    // Vieport

    s.viewport.drag().pinch().wheel().decelerate()
        .clampZoom({ minScale: s.zoomMin, maxScale: s.zoomMax })
        .setTransform(window.innerWidth / 2, window.innerHeight / 2, s.zoomMin, s.zoomMin)

    // Transparency on zoom

    const zoomOut = scaleLinear().domain([s.zoomMin, 2]).range([1, 0]) // Visible when zooming out
    const zoomIn = scaleLinear().domain([s.zoomMin, 2]).range([0, 1]) // Visible when zooming in

    s.viewport.on('zoomed', e => {
        const scale = e.viewport.lastViewport.scaleX
        e.viewport.children.find(child => child.name == 'contours').alpha = zoomOut(scale)
        e.viewport.children.find(child => child.name == 'nodes').alpha = zoomIn(scale)
        e.viewport.children.find(child => child.name == 'keywords_close').alpha = zoomIn(scale)
        e.viewport.children.find(child => child.name == 'keywords_distant').alpha = zoomOut(scale)
    })

    // Font loader
    
    BitmapFont.install(xml, Texture.from(png))

    /**
     * Rendering
     */

    background()
    links()
    contours()
    nodes()
    keywords_close()
    keywords_distant()
    // clusters()
    fps()
    search()

    // Prevent pinch gesture in Chrome

    window.onresize = function () {
        s.viewport.resize()
    }

    // Prevent wheel interference

    window.addEventListener('wheel', e => {
        e.preventDefault()
    }, { passive: false })

    // Code to save PNG

    // s.app.renderer.extract.canvas(s.app.stage).toBlob((b) => {
    //     const a = document.createElement('a')
    //     document.body.append(a)
    //     a.download = 'screenshot'
    //     a.href = URL.createObjectURL(b)
    //     a.click()
    //     a.remove()
    // }, 'image/png')

})