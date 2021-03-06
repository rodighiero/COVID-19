import { BitmapText, Circle, Graphics, Point } from 'pixi.js'

import { click } from '../interface/click'

const splitInTwo = string => {
    const middle = Math.round(string.length / 2)
    for (let i = middle, j = middle; i < string.length || j >= 0; i++, j--) {
        if (string[i] === ' ') return [string.substring(0, i), string.substring(i + 1)]
        if (string[j] === ' ') return [string.substring(0, j), string.substring(j + 1)]
    }
    return [string, '']
}

const color = {
    on: 0xFEDD00,
    off: 0xc7d1c2,
}


export default () => {

    const stage = new Graphics()
    stage.alpha = 0
    stage.name = 'nodes'
    s.viewport.addChild(stage)

    s.nodes.forEach(node => {

        // Circle

        const size = node.docs * .1

        node.circle = new Graphics()
        node.circle.beginFill(color.off, 1)
        node.circle.drawCircle(0, 0, size)
        node.circle.endFill()
        node.circle.tint = color.off
        node.circle.position = new Point(node.x, node.y)
        node.circle.hitArea = new Circle(0, 0, s.distance)
        node.circle.interactive = true

        stage.addChild(node.circle)

        // Label

        const scale = .2
        const [nA, nB] = splitInTwo(node.name)

        node.text = new BitmapText(
            `${nA}\n${nB}`,
            {
                fontName: 'Lato',
                fontSize: '21',
                fill: color.off,
                align: 'center',
            })

        node.text.scale.set(scale)
        node.text.position.set(node.x - node.text.width / 2, node.y + size + 2)

        stage.addChild(node.text)

        // Set information panel & set on circles

        node.circle.buttonMode = true

        node.circle.click = mouseData => {

            // Set information panel

            click(node)

            // Switch off nodes

            s.nodes.forEach(node => {
                node.circle.tint = color.off
                node.text.tint = color.off
            })

            // Switch on nodes

            s.nodes.filter(peer => node.peers.includes(peer.id))
                .forEach(node => {
                    node.circle.tint = color.on
                    node.text.tint = color.on
                })
        }


    })

}