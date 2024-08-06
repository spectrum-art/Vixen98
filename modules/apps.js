export const apps = {
    System: {
      name: 'System',
      type: 'app',
      icon: '💻',
      accessLevel: 1,
      showOnDesktop: true,
      jsFiles: ['system.js'],
      cssFiles: ['system.css'],
    },
    Trash: {
      name: 'Trash',
      type: 'folder',
      icon: '🗑️',
      accessLevel: 1,
      showOnDesktop: true,
      jsFiles: ['trash.js'],
      cssFiles: ['trash.css'],
      subApps: [],
    },
    Documents: {
      name: 'Documents',
      type: 'folder',
      icon: '📁',
      accessLevel: 1,
      showOnDesktop: true,
      jsFiles: ['documents.js'],
      cssFiles: ['documents.css'],
      subApps: ['Cookie Batch Log', 'Placeholder'],
    },
    'Cookie Batch Log': {
      name: 'Cookie Batch Log',
      type: 'app',
      icon: '🍪',
      accessLevel: 1,
      showOnDesktop: false,
      jsFiles: ['cookieBatchLog.js'],
      cssFiles: ['cookieBatchLog.css'],
    },
    'Cookie Delivery Map': {
      name: 'Cookie Deliveries',
      type: 'map',
      icon: '🍪',
      accessLevel: 1,
      showOnDesktop: false,
      jsFiles: ['cookieDeliveryMap.js'],
      cssFiles: ['cookieDeliveryMap.css'],
    },
    Encryption: {
      name: 'Encryption',
      type: 'app',
      icon: '🔒',
      accessLevel: 1,
      showOnDesktop: true,
      jsFiles: ['encryption.js'],
      cssFiles: ['encryption.css'],
    },
    'Lemon List': {
      name: 'Lemon List',
      type: 'app',
      icon: '🍋',
      accessLevel: 1,
      showOnDesktop: true,
      jsFiles: ['lemonList.js'],
      cssFiles: ['lemonList.css'],
    },
    Maps: {
      name: 'Maps',
      type: 'folder',
      icon: '🗺️',
      accessLevel: 1,
      showOnDesktop: true,
      jsFiles: ['maps.js'],
      cssFiles: ['maps.css'],
      subApps: ['Cookie Delivery Map', 'Underground Map'],
    },
    Placeholder: {
      name: 'Placeholder',
      type: 'app',
      icon: '📄',
      accessLevel: 1,
      showOnDesktop: false,
      jsFiles: ['placeholder.js'],
      cssFiles: ['placeholder.css'],
    },
    Propaganda: {
      name: 'Propaganda',
      type: 'app',
      icon: '🏛️',
      accessLevel: 1,
      showOnDesktop: true,
      jsFiles: ['propaganda.js'],
      cssFiles: ['propaganda.css'],
    },
    'Underground Map': {
      name: 'Underground',
      type: 'map',
      icon: '🐀',
      accessLevel: 1,
      showOnDesktop: false,
      jsFiles: ['undergroundMap.js'],
      cssFiles: ['undergroundMap.css'],
    },
    Alibi: {
      name: 'Alibi',
      type: 'app',
      icon: '㊙️',
      accessLevel: 1,
      showOnDesktop: true,
      jsFiles: ['propaganda.js'],
      cssFiles: ['propaganda.css'],
    },
    QDaddy: {
      name: 'QDaddy',
      type: 'app',
      icon: '㊙️',
      accessLevel: 1,
      showOnDesktop: true,
      jsFiles: ['propaganda.js'],
      cssFiles: ['propaganda.css'],
    },
    GeoQuesting: {
      name: 'GeoQuesting',
      type: 'app',
      icon: '🧭',
      accessLevel: 1,
      showOnDesktop: true,
      jsFiles: ['propaganda.js'],
      cssFiles: ['propaganda.css'],
    },
    Gossip: {
      name: 'Gossip',
      type: 'app',
      icon: '👄',
      accessLevel: 1,
      showOnDesktop: true,
      jsFiles: ['propaganda.js'],
      cssFiles: ['propaganda.css'],
    },
    Cookbook: {
      name: 'Cookbook',
      type: 'app',
      icon: '📖',
      accessLevel: 1,
      showOnDesktop: true,
      jsFiles: ['propaganda.js'],
      cssFiles: ['propaganda.css'],
    },
    Stocks: {
      name: 'Stocks',
      type: 'app',
      icon: '🚀',
      accessLevel: 1,
      showOnDesktop: true,
      jsFiles: ['propaganda.js'],
      cssFiles: ['propaganda.css'],
    },
  };