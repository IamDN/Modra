var objHandler = {
    download: function(file) {
        this.saveFile(file.name, file.data);
    },

    saveFile: function(name, bytes) {
        // Create file from drawing data
        const filename = name + ".zip";
        const file = new File(
            [bytes], filename,
            { type: "application/zip" }
        );

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
