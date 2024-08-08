export function initialize(container, params = {}) {
    if (!container || !(container instanceof HTMLElement)) {
        console.error('Invalid container provided to Cookie Delivery Map initialize function');
        return;
    }

    console.log('Opening Cookie Delivery Map');
    const mapUrl = `https://gta-5-map.com/?\
        slideout=false&slideoutright=false&x=-120.1&y=80.5&zoom=3.4&embed=light\
        &notes=3EWfhJLeGcb,3nf05rUzzTS,61hDtXO1IAV,6KSIzbU0JCX,78yKmWHpAxr,8qmes9jiqky,\
        9LdfkbPEQUp,Akr3xVeFxPx,BzSCrsUcHX0,CAecif3MPtL,CxmrjyVaMdb,ErAwcUUL4Jv,FqeP7JRiEfO,\
        Gg4LUImN5RM,GZAFGvIkhQl,HD2hOgesZEE,Hpc1RWCbYNJ,HxWPJdFD5zG,I02HCZZmolC,I6nFz53EbKo,\
        JbMeXCoX67S,K0Gco51LKq8,KOFXc19AHzl,KuW1Kv0rFKa,tzvgY7VwaI`;

    container.innerHTML = `
        <iframe src="${mapUrl}" 
            style="border: none; width: 100%; height: 100%;" 
            sandbox="allow-scripts allow-same-origin">
        </iframe>`;
}