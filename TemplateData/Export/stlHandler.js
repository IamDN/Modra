var stlHandler = {
    download: function(file) {
        this.saveFile(file.name, file.data);
    },

    saveFile: function(name, bytes) {
        // Create file from string data
        const filename = name + ".stl";
        var data = '';
        for (var i = 0; i < bytes.byteLength; i++) {
             data += String.fromCharCode( bytes[ i ] );
        }
        const file = new File([data], filename, { type: "model/stl" });

        // Create link with file URL
        const link = document.createElement("a");
        link.href = URL.createObjectURL(file);
        link.rel = "noopener";
        link.download = filename;
        link.onclick = () => {
            // Destroy file after 30s
            setTimeout(function() {
                URL.revokeObjectURL(link.href);
            }, 30_000);
        }

        // Download file (delay for compatibility)
        setTimeout(function() {
            link.dispatchEvent(new MouseEvent("click"));
        }, 0);
    },
};
