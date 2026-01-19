var domStyle = window.getComputedStyle(document.body)

class ConnectionStyle {
    constructor(style = {}) {
        this.secondaryColor = domStyle.getPropertyValue('--bs-secondary')
        this.primaryColor = domStyle.getPropertyValue('--bs-primary')
        this.dangerColor = domStyle.getPropertyValue('--bs-danger')

        this.stroke = style.stroke ?? undefined;
        this.width = style.width ?? 2;
        this.dash = style.dash ?? null;
        this.animated = !!style.animated;

        this.arrows = {
            start: style.arrows?.start ?? false,
            end: style.arrows?.end ?? true,
        };

        // semantic states
        this.bad = false;
        this.hover = false;
        this.selected = false;
        this.temp = false;
    }

    markBad(v = true) {
        this.bad = v;
    }

    markHover(v = true) {
        this.hover = v;
    }

    markSelected(v = true) {
        this.selected = v;
    }

    markTemp(v = true) {
        this.temp = v;
    }

    applyTo(path) {
        if (this.stroke) path.style.stroke = this.stroke;
        path.style.strokeWidth = this.width;
        path.style.strokeDasharray = this.dash ?? "";

        path.classList.toggle("animated", this.animated);
        path.classList.toggle("flow-connection-temp", this.temp);
        path.classList.toggle("flow-connection-path-bad", this.bad);
        path.classList.toggle("selected", this.selected);

        path.classList.toggle("path-hover", this.hover);
    }
}

export { ConnectionStyle };
