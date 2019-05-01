class ToggleVisualization {
    constructor(idToggle, idDivOff, idDivOn, checked = false) {
        this._idToggle = idToggle;
        this._checked = false;
        this._dirty = false;

        let divOnInput = document.getElementById(idDivOn);
        let divOffInput = document.getElementById(idDivOff);

        $('.grid').masonry({
            itemSelector: '.grid-item',
            columnWidth: 400
        });

        $(`#${this._idToggle}`).change(((idTog, divOn, divOff) => {
            return () => {
                let elToggle = document.getElementById(idTog);
                if (elToggle.checked) {
                    divOn.classList.remove('hidden');
                    divOff.classList.add('hidden');
                    localStorage.setItem(idTog, 'on');
                    this._checked = true;
                    $('.grid').masonry('layout');
                } else {
                    divOn.classList.add('hidden');
                    divOff.classList.remove('hidden');
                    localStorage.setItem(idTog, 'off');
                    this._checked = false;
                }

                if (this.dirty) {
                    this.dirty = false;
                    location.reload();
                }
            }
        })(idToggle, divOnInput, divOffInput));

        let lastState = localStorage.getItem(idToggle);
        if (lastState) {
            if (lastState == 'on') {
                this.checked = true;
            } else {
                this.checked = false;
            }
        } else {
            this.checked = checked;
        }
    }

    get dirty() {
        return this._dirty;
    }

    set dirty(value) {
        this._dirty = value;
    }

    isDirty() {
        this._dirty = true;
    }

    get checked() {
        return this._checked;
    }

    set checked(value) {
        if (value === true) {
            this._checked = true;
            $(`#${this._idToggle}`).bootstrapToggle('on');
        } else {
            this._checked = false;
            $(`#${this._idToggle}`).bootstrapToggle('off');
        }
    }

    update() {
        $('.grid').masonry('layout');
    }
}