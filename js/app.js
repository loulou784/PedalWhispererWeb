document.addEventListener('DOMContentLoaded', () => {
    // Get the container element
    const container = document.querySelector('.container');

    const box = new WinBox({
        title: "PedalWhisperer Console",
        mount: document.createElement('div'),
        class: ["no-full"],
        x: "center",
        y: "40px", // Fixed position below navbar
        width: "50%",
        height: "50%",
        root: container,
        top: "40px", // Prevent dragging above navbar
        html: "<div style='padding: 20px;'><h2>Welcome to PedalWhisperer Console</h2><p>This window is confined to the container area.</p></div>"
    });
});
