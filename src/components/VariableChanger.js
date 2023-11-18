import "./VariableChanger.scss"
import React from "react"
import get from "lodash.get"

export function makeSelectorOptions(arr) {
    let options = []
    arr.forEach( (item, idx) => {
        if (typeof item === 'string') {
            options.push({key: idx, text: item, item: item})
        } else if (typeof item.name === 'string') {
            options.push({key: idx, text: item.name, item: item})

        } else if (typeof item.text === 'string') {
            options.push({key: idx, text: item.text, item: item})
        } else {
            options.push({key: idx, text: JSON.stringify(item), item: item})
        }
    })
    return options
}

export function presetOrDef(props, name, defVal) {
    if (props.presets) {
        return get(props.presets, name, defVal)
    }
    return defVal
}

export class VariableChangeSet {
    constructor() {
        this.variables = []
        this.variablesIndexed = {}
        this.autoSetStateFn = null
    }

    getVariableCount() {
        return this.variables.length
    }
    getVariable(varName) {
        return this.variablesIndexed[varName]
    }
    setValue(varName, value, valueText) {
        let variable = this.variablesIndexed[varName]
        if (variable) {
            variable.value = value
            variable.valueText = valueText
        }
    }
    getValue(varName, defaultVal) {
        let variable = this.variablesIndexed[varName]
        if (!variable) {
            return defaultVal
        }

        if (variable.type === 'selector') {
            return variable.options[variable.value].item
        } else {
            return variable.value
        }
    }
    getSelectorIndex(varName, defaultVal) {
        let variable = this.variablesIndexed[varName]
        if (!variable) {
            return defaultVal
        }

        if (variable.type === 'selector') {
            return variable.value
        } else {
            return defaultVal
        }
    }
    addSeparator() {
        this.variables.push({type:'separator'})
        return this
    }
    addNumberSlider(name, label, min, max, increment, currentValue, currentText, minText, maxText) {
        let variable = {
            name: name,
            label: label,
            type: 'slider',
            min: min,
            max: max,
            increment: increment,
            value: currentValue,
            valueText: currentText || `${currentValue}`
        }
        if (minText && currentValue === min) {
            variable.valueText = minText
        }
        if (maxText && currentValue === max) {
            variable.valueText = maxText
        }
        this.variables.push(variable)
        this.variablesIndexed[name] = variable
        return this
    }

    addSwitch(name, label, currentValue) {
        let variable = {
            name:  name,
            label: label,
            type: 'switch',
            value: !!currentValue
        }
        this.variables.push(variable)
        this.variablesIndexed[name] = variable
        return this
    }

    addSelector(name, label, options, currentValueIdx) {
        let variable = {
            name:  name,
            label: label,
            type: 'selector',
            options: options,
            value: currentValueIdx || 0
        }
        this.variables.push(variable)
        this.variablesIndexed[name] = variable
        return this
    }

    getReactState() {
        let st = {}
        this.variables.forEach( (item) => {
            st[item.name] = item.value
        })
        return st
    }
}


export default class VariableChanger extends React.Component {
    constructor(props) {
        super(props)
        this.state = {edits: 0}
    }

    render() {
        let editors = []
        let editorSets = [editors]
        let changeSet = this.props.changeSet
        if (changeSet && changeSet.variables && changeSet.variables.length > 0) {
            changeSet.variables.forEach( (vdef) =>  {
                if (vdef.type === 'separator') {
                    // start a new line
                    editors = []
                    editorSets.push(editors)
                } else if  (vdef.type === 'slider') {
                    let ctrl = <div key={vdef.name} className="param_holder">
                        <div className="param_top_row">
                            <div className="param_label">{vdef.label}:&nbsp;</div>
                            <div className="param_value">{vdef.valueText || vdef.value}</div>
                        </div>
                        <input className="param_slider" type='range' min={vdef.min} max={vdef.max} step={vdef.increment} value={vdef.value} onInput={(e) => {
                            vdef.valueText = e.target.value
                            vdef.value = parseFloat(e.target.value)

                            if (this.props.onVariableChanged) {
                                this.props.onVariableChanged(vdef, changeSet)
                            }
                            this.setState({edits: this.state.edits + 1})
                        }} />
                    </div>
                    editors.push(ctrl)
                } else if  (vdef.type === 'switch') {
                    let ctrl = <div key={vdef.name} className="param_holder">
                        <div className="param_top_row">
                            <div className="param_label">{vdef.label}</div>
                        </div>
                        <label className="switch">
                            <input className="param_switch" type='checkbox' checked={vdef.value} onChange={(e) => {
                            vdef.value = !vdef.value
                            
                            if (this.props.onVariableChanged) {
                                this.props.onVariableChanged(vdef, changeSet)
                            }
                            this.setState({edits: this.state.edits + 1})
                        }} />
                            <span className="slider round"/>
                        </label>
                    </div>
                    editors.push(ctrl)
                } else if  (vdef.type === 'selector') {
                    let options = []
                    vdef.options.forEach((opt) => {
                        options.push(<option key={opt.key} value={opt.key}>{opt.text}</option>)
                    })
                    let ctrl = <div key={vdef.name} className="param_holder">
                        <div className="param_top_row">
                            <div className="param_label">{vdef.label}</div>
                        </div>
                        <div className="select">
                            <select id="standard-select" value={vdef.value} onChange={(e) => {
                                vdef.value = parseInt(e.target.value)

                                if (this.props.onVariableChanged) {
                                    this.props.onVariableChanged(vdef, changeSet)
                                }
                                this.setState({edits: this.state.edits + 1})
                            }}>
                                {options}
                            </select>
                            <span className="focus"></span>
                        </div>
                    </div>
                    editors.push(ctrl)
                }
            })
        }

        return <div className='VariableChanger'style={{width:this.props.width || '100%'}}>
            {editorSets.map((es, idx) => {
                return <div key={`es-${idx}`} className='vc-editor-set'>
                    {es}
                    </div>
            })}
        </div>
    }
}

// const SLIDER_SHAPE = {
//     name: 'foobar',
//     label: 'BotCount',
//     type: 'slider',
//     min: 0,
//     max: 100,
//     increment: 1,
//     value: 34,
//     valueText: '34'
// }
// const SWITCH_SHAPE = {
//     name: 'foobar',
//     label: 'bouncey',
//     type: 'switch',
//     value: true
// }
// const SELECTOR_SHAPE = {
//     name: 'foobar',
//     label: 'bouncey',
//     type: 'selector',
//     options: [{key: 1, text:"on"}, {key: 2, text: 'maybe'}],
//     value: 1
// }
