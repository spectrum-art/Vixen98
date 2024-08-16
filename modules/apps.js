export const apps = {
  system: {
    id: 'system',
    name: 'System',
    type: 'app',
    icon: '💻',
    accessLevel: 1,
    showOnDesktop: true,
    jsFiles: ['system.js'],
    cssFiles: ['system.css'],
    window: {
      width: '35%',
      height: '38%',
      minWidth: '350px',
      minHeight: '380px'
    }
  },
  trash: {
    id: 'trash',
    name: 'Trash',
    type: 'folder',
    icon: '🗑️',
    accessLevel: 1,
    showOnDesktop: true,
    jsFiles: ['trash.js'],
    cssFiles: ['trash.css'],
    subApps: [],
    window: {
      width: '45%',
      height: '45%',
      minWidth: '450px',
      minHeight: '450px'
    }
  },
  documents: {
    id: 'documents',
    name: 'Documents',
    type: 'folder',
    icon: '📁',
    accessLevel: 1,
    showOnDesktop: true,
    jsFiles: ['documents.js'],
    cssFiles: ['documents.css'],
    subApps: ['cookieBatchLog', 'placeholder'],
    window: {
      width: '45%',
      height: '45%',
      minWidth: '450px',
      minHeight: '450px'
    }
  },
  cookieBatchLog: {
    id: 'cookieBatchLog',
    name: 'Cookie Batch Log',
    type: 'app',
    icon: '🍪',
    accessLevel: 1,
    showOnDesktop: false,
    jsFiles: ['cookieBatchLog.js'],
    cssFiles: ['cookieBatchLog.css'],
    window: {
      width: '90%',
      height: '90%',
      minWidth: '600px',
      minHeight: '400px'
    }
  },
  cookieDeliveryMap: {
    id: 'cookieDeliveryMap',
    name: 'Cookie Delivery',
    type: 'map',
    icon: '🍪',
    accessLevel: 1,
    showOnDesktop: false,
    jsFiles: ['cookieDeliveryMap.js'],
    cssFiles: ['cookieDeliveryMap.css'],
    window: {
      width: '80%',
      height: '80%',
      minWidth: '800px',
      minHeight: '800px'
    }
  },
  encryption: {
    id: 'encryption',
    name: 'Encryption',
    type: 'app',
    icon: '🔒',
    accessLevel: 1,
    showOnDesktop: true,
    jsFiles: ['encryption.js'],
    cssFiles: ['encryption.css'],
    window: {
      width: '50%',
      height: '30%',
      minWidth: '500px',
      minHeight: '300px'
    }
  },
  lemonList: {
    id: 'lemonList',
    name: 'Lemon List',
    type: 'app',
    icon: '🍋',
    accessLevel: 1,
    showOnDesktop: true,
    jsFiles: ['lemonList.js'],
    cssFiles: ['lemonList.css'],
    window: {
      width: '90%',
      height: '80%',
      minWidth: '900px',
      minHeight: '800px'
    }
  },
  maps: {
    id: 'maps',
    name: 'Maps',
    type: 'folder',
    icon: '🗺️',
    accessLevel: 1,
    showOnDesktop: true,
    jsFiles: ['maps.js'],
    cssFiles: ['maps.css'],
    subApps: ['cookieDeliveryMap', 'undergroundMap'],
    window: {
      width: '45%',
      height: '45%',
      minWidth: '450px',
      minHeight: '450px'
    }
  },
  placeholder: {
    id: 'placeholder',
    name: 'Placeholder',
    type: 'app',
    icon: '📄',
    accessLevel: 1,
    showOnDesktop: false,
    jsFiles: ['placeholder.js', 'particleBezier.js'],
    cssFiles: ['placeholder.css'],
    window: {
      width: '66.67%',
      height: '90%',
      minWidth: '600px',
      minHeight: '400px'
    }
  },
  propaganda: {
    id: 'propaganda',
    name: 'Propaganda',
    type: 'app',
    icon: '🏛️',
    accessLevel: 1,
    showOnDesktop: true,
    jsFiles: ['propaganda.js'],
    cssFiles: ['propaganda.css'],
    window: {
      width: '40%',
      height: '80%',
      minWidth: '400px',
      minHeight: '800px'
    }
  },
  undergroundMap: {
    id: 'undergroundMap',
    name: 'Underground',
    type: 'map',
    icon: '🐀',
    accessLevel: 1,
    showOnDesktop: false,
    jsFiles: ['undergroundMap.js'],
    cssFiles: ['undergroundMap.css'],
    window: {
      width: '67%',
      height: '95%',
      minWidth: '670px',
      minHeight: '950px'
    }
  },

  alibi: {
    id: 'alibi',
    name: 'Alibi',
    type: 'app',
    icon: '㊙️',
    accessLevel: 1,
    showOnDesktop: true,
    jsFiles: ['alibi.js'],
    cssFiles: ['alibi.css'],
    window: {
      width: '50%',
      height: '59%',
      minWidth: '500px',
      minHeight: '590px'
    }
  },
};

export const getAppById = (id) => apps[id];

/*  GeoQuesting: {
      name: 'GeoQuesting',
      type: 'app',
      icon: '🧭',
      accessLevel: 1,
      showOnDesktop: true,
      jsFiles: ['propaganda.js'],
      cssFiles: ['propaganda.css'],
      window: {
        width: '90%',
        height: '90%',
        minWidth: '600px',
        minHeight: '400px'
      }
    },
    Cookbook: {
      name: 'Cookbook',
      type: 'app',
      icon: '📖',
      accessLevel: 1,
      showOnDesktop: true,
      jsFiles: ['propaganda.js'],
      cssFiles: ['propaganda.css'],
      window: {
        width: '90%',
        height: '90%',
        minWidth: '600px',
        minHeight: '400px'
      }
    },
     Gossip: {
      name: 'Gossip',
      type: 'app',
      icon: '👄',
      accessLevel: 1,
      showOnDesktop: true,
      jsFiles: ['propaganda.js'],
      cssFiles: ['propaganda.css'],
      window: {
        width: '90%',
        height: '90%',
        minWidth: '600px',
        minHeight: '400px'
      }
    },
    QDaddy: {
      name: 'QDaddy',
      type: 'app',
      icon: '🚄',
      accessLevel: 1,
      showOnDesktop: true,
      jsFiles: ['propaganda.js'],
      cssFiles: ['propaganda.css'],
      window: {
        width: '90%',
        height: '90%',
        minWidth: '600px',
        minHeight: '400px'
      }
    },
    Stocks: {
      name: 'Stocks',
      type: 'app',
      icon: '🚀',
      accessLevel: 1,
      showOnDesktop: true,
      jsFiles: ['propaganda.js'],
      cssFiles: ['propaganda.css'],
      window: {
        width: '90%',
        height: '90%',
        minWidth: '600px',
        minHeight: '400px'
      }
    }, */

// export const getAppById = (id) => Object.values(apps).find(app => app.id === id);