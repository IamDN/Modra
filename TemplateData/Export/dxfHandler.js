var dxfHandler = {
    download: function(file) {
        this.saveDrawing(file.name, file.data);
    },

    saveDrawing: function(name, bytes) {
        // Create file from drawing data
        const filename = name + ".dxf";
        const data =new TextDecoder().decode(bytes);
        const file = new File([data], filename, { type: "image/x-dxf" })

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
