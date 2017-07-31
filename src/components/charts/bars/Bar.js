import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { merge } from 'lodash'
import { TransitionMotion, spring } from 'react-motion'
import Nivo, { defaultTheme } from '../../../Nivo'
import { margin as marginPropType } from '../../../PropTypes'
import { getColorRange } from '../../../ColorUtils'
import {
    generateGroupedBars,
    generateStackedBars,
} from '../../../lib/charts/bar'
import SvgWrapper from '../SvgWrapper'
import Axis from '../../axes/Axis'
import Grid from '../../axes/Grid'
import BarItem from './BarItem'
import BarItemLabel from './BarItemLabel'

const axisPropType = PropTypes.shape({
    tickSize: PropTypes.number,
    tickPadding: PropTypes.number,
    format: PropTypes.func,
})

export default class Bar extends Component {
    static propTypes = {
        // data
        data: PropTypes.arrayOf(
            PropTypes.shape({
                id: PropTypes.string.isRequired,
                data: PropTypes.arrayOf(
                    PropTypes.shape({
                        x: PropTypes.oneOfType([
                            PropTypes.number,
                            PropTypes.string,
                        ]).isRequired,
                        y: PropTypes.oneOfType([
                            PropTypes.number,
                            PropTypes.string,
                        ]).isRequired,
                    })
                ).isRequired,
            })
        ).isRequired,

        groupMode: PropTypes.oneOf(['stacked', 'grouped']).isRequired,

        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        margin: marginPropType,
        xPadding: PropTypes.number.isRequired,

        // axes
        axes: PropTypes.shape({
            top: axisPropType,
            right: axisPropType,
            bottom: axisPropType,
            left: axisPropType,
        }),
        enableGridX: PropTypes.bool.isRequired,
        enableGridY: PropTypes.bool.isRequired,

        // labels
        enableLabels: PropTypes.bool.isRequired,

        // interactions
        onClick: PropTypes.func,

        theme: PropTypes.object.isRequired,
        colors: PropTypes.any.isRequired,

        // motion
        animate: PropTypes.bool.isRequired,
        motionStiffness: PropTypes.number.isRequired,
        motionDamping: PropTypes.number.isRequired,
    }

    static defaultProps = {
        margin: Nivo.defaults.margin,
        groupMode: 'stacked',
        colors: Nivo.defaults.colorRange,
        xPadding: 0.1,
        enableLabels: true,
        axes: {
            left: {},
            bottom: {},
        },
        enableGridX: false,
        enableGridY: true,
        theme: {},
        animate: true,
        motionStiffness: Nivo.defaults.motionStiffness,
        motionDamping: Nivo.defaults.motionDamping,
    }

    render() {
        const {
            data,
            groupMode,
            margin: _margin,
            width: _width,
            height: _height,
            colors,
            xPadding,
            axes,
            enableGridX,
            enableGridY,
            enableLabels,
            theme: _theme,
            animate,
            motionStiffness,
            motionDamping,
        } = this.props

        const margin = Object.assign({}, Nivo.defaults.margin, _margin)
        const width = _width - margin.left - margin.right
        const height = _height - margin.top - margin.bottom

        const theme = merge({}, defaultTheme, _theme)
        const color = getColorRange(colors)

        const motionProps = {
            animate,
            motionDamping,
            motionStiffness,
        }

        let result
        if (groupMode === 'grouped') {
            result = generateGroupedBars(data, width, height, color, {
                xPadding,
            })
        } else if (groupMode === 'stacked') {
            result = generateStackedBars(data, width, height, color, {
                xPadding,
            })
        }

        let bars
        if (animate === true) {
            bars = (
                <TransitionMotion
                    /*
                    willEnter={this.willEnter}
                    willLeave={this.willLeave}
                    */
                    styles={result.bars.map(bar => {
                        return {
                            key: bar.key,
                            data: {
                                color: bar.color,
                                value: bar.value,
                            },
                            style: {
                                x: spring(bar.x, motionProps),
                                y: spring(bar.y, motionProps),
                                width: spring(bar.width, motionProps),
                                height: spring(bar.height, motionProps),
                            },
                        }
                    })}
                >
                    {interpolatedStyles =>
                        <g>
                            {interpolatedStyles.map(
                                ({ key, style, data: { value, color } }) =>
                                    <BarItem
                                        key={key}
                                        x={style.x}
                                        y={style.y}
                                        width={style.width}
                                        height={style.height}
                                        color={color}
                                    />
                            )}
                        </g>}
                </TransitionMotion>
            )
        } else {
            bars = result.bars.map(d => <BarItem key={d.key} {...d} />)
        }

        return (
            <SvgWrapper width={_width} height={_height} margin={margin}>
                <Grid
                    theme={theme}
                    width={width}
                    height={height}
                    xScale={enableGridX ? result.xScale : null}
                    yScale={enableGridY ? result.yScale : null}
                />
                {['top', 'right', 'bottom', 'left'].map(position => {
                    if (!axes[position]) return null

                    const axis = axes[position]
                    const scale = ['top', 'bottom'].includes(position)
                        ? result.xScale
                        : result.yScale

                    return (
                        <Axis
                            theme={theme}
                            {...motionProps}
                            {...axis}
                            key={position}
                            width={width}
                            height={height}
                            position={position}
                            scale={scale}
                        />
                    )
                })}
                {bars}
                {enableLabels &&
                    result.bars.map(d => <BarItemLabel {...d} key={d.key} />)}
            </SvgWrapper>
        )
    }
}