const colorSchemes = [
    { name: "Black", defaultBackgroundType: 'light', colors: ['#000000'] },
    { name: "White", defaultBackgroundType: 'dark', colors: ['#ffffff'] },
    { name: "Cyan", defaultBackgroundType: 'dark', colors: ['#7ec7da'] },
    { name: "Purple", defaultBackgroundType: 'dark', colors: ['#b919fa'] },
    { name: "Dark Purple", defaultBackgroundType: 'dark', colors: ['#9700b2'] },
    { name: "Yellow", defaultBackgroundType: 'dark', colors: ['#ffe232'] },
    { name: "Red", defaultBackgroundType: 'dark', colors: ['#ff0000'] },
    { name: "Purples", defaultBackgroundType: 'dark', colors: ['#ffccfe', '#ffb8fd', '#ffa4fd', '#ff8efc', '#ff73fc', '#fb42fb', '#b919fa', '#9c17fa', '#8016fa', '#6d16fa', '#4e37f9'] },
    { name: "Dark Purples", defaultBackgroundType: 'dark', colors: ['#d74de0', '#a918ce', '#b919fa', '#9c17fa', '#8016fa', '#6d16fa', '#4a08b4', '#4e37f9'] },
    { name: "Blues", defaultBackgroundType: 'dark', colors: ['#a0fdf3', '#49e7f5','#00d0f7', '#1f9af8', '#2067f8','#2a42f5', '#130093' ]},
    { name: "Cool Blues", defaultBackgroundType: 'dark', colors: ['#ffffff', '#e7fcfb', '#7ec7da', '#55acce', '#2788ab', '#154353','#1c667a']},
    { name: "Fiery", defaultBackgroundType: 'dark', colors: ['#fffec8', '#fffc80', '#ffe232', '#ff9b25', '#ff561e', '#e31a17', '#9c1110'] },
    { name: "Gilded", defaultBackgroundType: 'dark', colors: ['#ffdc73', '#ffcf40', '#ffbf00', '#bf9b30', '#a67c00'] },
    { name: "Greens", defaultBackgroundType: 'dark', colors: ['#fafaca', '#dcd443', '#97ba2b', '#51a12d', '#287869', '#1c6491', '#1b41c8'] },
    { name: "Sandy", defaultBackgroundType: 'dark', colors: ['#e0d0b8', '#d9c1a0', '#b9a180', '#b29158', '#b19979', '#836c53', '#5f4736'] },
]
colorSchemes.forEach((cs) => {
    if (cs.colors.length > 1) {
        cs.colors = cs.colors.concat(Array.from(cs.colors).reverse())
    }
})

export default colorSchemes;