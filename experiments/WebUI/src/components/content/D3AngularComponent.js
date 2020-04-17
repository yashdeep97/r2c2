import React from 'react';
import * as d3 from "d3";
import '../../assets/gauge.css';

import FrontIcon from '../../assets/img/submarine-front-view.svg';
import SideIcon from '../../assets/img/submarine-side-view.svg';


class D3AngularComponent extends React.Component{

	static defaultProps = {
		size						: 100,
		clipWidth					: 100,
		clipHeight					: 100,
		ringInset					: 20,
		ringWidth					: 3,

		pointerWidth				: 1,
		pointerTailLength			: 5,
		pointerHeadLengthPercent	: 0.5,

		minValue					: 0,
		maxValue					: 360,

		minAngle					: -90,
		maxAngle					: 270,

		transitionMs				: 750,

		centralIcon					: SideIcon,
		iconHeight					: 20,

		majorTicks					: 4,
		labelFormat					: d3.format('d'),
		labelInset					: 10,
		arcColor					: '#000000',
		arcColorFn					: d3.interpolateHsl(d3.rgb('#e8e2ca'), d3.rgb('#3e6c0a'))
	}

	constructor(props, context){
		super(props, context)
		this.state = {

		}
		this.range = undefined;
		this.renderD3Gauge = this.renderD3Gauge.bind(this);
		this.deg2rad = this.deg2rad.bind(this);
		this.update = this.update.bind(this);
	}

	componentDidMount() {
		this.renderD3Gauge();
	}

	componentDidUpdate(prevProps) {
		if (prevProps.val !== this.props.val) {
			this.update(this.props.val);
		}
	}

	deg2rad(deg) {
		return deg * Math.PI / 180;
	}

	renderD3Gauge(newValue){
		this.range = this.props.maxAngle - this.props.minAngle;
		const r = this.props.size / 2;
		const pointerHeadLength = Math.round(r * this.props.pointerHeadLengthPercent);

		// a linear scale that maps domain values to a percent from 0..1
		this.scale = d3.scaleLinear()
			.range([0,1])
			.domain([this.props.minValue, this.props.maxValue]);

		// const ticks = this.scale.ticks(this.props.majorTicks);//the values depend on the domain and no. of values -> config.majorTicks
		const ticks = [0, 90, 180, 270];
		// console.log(ticks);

		const tickData = d3.range(this.props.majorTicks).map(() => {
			return 1/this.props.majorTicks;
		});

		const arc = d3.arc()
			.innerRadius(r - this.props.ringWidth - this.props.ringInset)
			.outerRadius(r - this.props.ringInset)
			.startAngle((d, i) => {
				var ratio = d * i;
				return this.deg2rad(this.props.minAngle + (ratio * this.range));
			})
			.endAngle((d, i) => {
				var ratio = d * (i+1);
				return this.deg2rad(this.props.minAngle + (ratio * this.range));
			});



		const svg = d3.select(this.gaugeDiv)
			.append('svg:svg')
				.attr('class', 'gauge')
				.attr('width', this.props.clipWidth)
				.attr('height', this.props.clipHeight);

		var centerTx = 'translate(' + r + ',' + r + ')';

		var arcs = svg.append('g')
				.attr('class', 'arc')
				.attr('transform', centerTx);

		arcs.selectAll('path')
				.data(tickData)
			.enter().append('path')
				// .attr('fill', (d, i) => {
				// 	return this.props.arcColorFn(d * i);
				// })
				.attr('fill', this.props.arcColor)
				.attr('d', arc);


		this.submarineSVG = null;

		var lg = svg.append('g')
				.attr('class', 'label')
				.attr('transform', centerTx);
		lg.selectAll('text')
				.data(ticks)
			.enter().append('text')
				.style("font-size", "10px")
				.attr('transform', (d) => {
					var ratio = this.scale(d);
					var newAngle = this.props.minAngle + (ratio * this.range);
					return 'rotate(' +newAngle +') translate(0,' +(this.props.labelInset - r) +')';
				})
				.text(this.props.labelFormat);

        this.gaugeVal = svg.append('g')
                        .attr('class', 'gaugeVal')
                        .attr('transform', centerTx);
        this.gaugeVal.append('text')
				.style("font-size", "10px")
                .text('0')
                .attr('transform','translate(0, -10)');

		const lineData = [ [this.props.pointerWidth / 2, 0],
						[0, -pointerHeadLength],
						[-(this.props.pointerWidth / 2), 0],
						[0, this.props.pointerTailLength],
						[this.props.pointerWidth / 2, 0] ];
		const pointerLine = d3.line().curve(d3.curveMonotoneX);
		const pg = svg.append('g').data([lineData])
				.attr('class', 'pointer')
				.attr('transform', centerTx);

		this.pointer = pg.append('path')
			.attr('d', pointerLine/*function(d) { return pointerLine(d) +'Z';}*/ )
			.attr('transform', 'rotate(' + this.props.minAngle +')');


// ************2nd pointer********
        const lineData2 = [ [this.props.pointerWidth / 2, 0],
						[0, -pointerHeadLength],
						[-(this.props.pointerWidth / 2), 0],
						[0, this.props.pointerTailLength],
						[this.props.pointerWidth / 2, 0] ];
		const pointerLine2 = d3.line().curve(d3.curveMonotoneX);
		const pg2 = svg.append('g').data([lineData2])
				.attr('class', 'pointer2')
				.attr('transform', centerTx);

		this.pointer2 = pg2.append('path')
			.attr('d', pointerLine2/*function(d) { return pointerLine(d) +'Z';}*/ )
			.attr('transform', 'rotate(' + this.props.minAngle +')');
// *************

		// update((newValue === undefined) ? 0 : newValue);
		// this.update(Math.random() * 10);

		d3.xml(this.props.centralIcon)
		.then(data => {
			svg.append('g').node().append(data.documentElement);

			this.submarineSVG = svg.select("svg");
			this.submarineSVG.attr("height", this.props.iconHeight)
					.attr('transform', 'translate(' + r + ', ' + r + ') rotate(0) translate(-' + r + ', -' + this.props.iconHeight / 2 + ')');

			this.update(30);
		})

		this.update(0);
	}

	update(newValue) {

		const r = this.props.size / 2;

		const ratio1 = this.scale(newValue);
		const newAngle1 = this.props.minAngle + (ratio1 * this.range);
		const ratio2 = this.scale(newValue + 180);
		const newAngle2 = this.props.minAngle + (ratio2 * this.range);
		this.pointer.transition()
			.duration(0)
			.ease(d3.easeElastic)
			.attr('transform', 'rotate(' + newAngle1 +')');

		this.pointer2.transition()
				.duration(0)
				.attr('transform', 'rotate(' + newAngle2 +')');

		// console.log(newAngle1);

		if(this.submarineSVG !== null){
			// console.log(newAngle1);
			this.submarineSVG.transition()
				.duration(0)
				.attr("transform", 'translate(' + r + ', ' + r + ') rotate(' + ratio1 * this.range + ') translate(-' + r + ', -' + this.props.iconHeight / 2 + ')');
		}

		this.gaugeVal.select('text').text(newValue.toFixed(2));
	}


	render(){
		const titleStyle = {
			fontWeight: "bold",
			textAlign: "center",
			fontSize: "0.75em",
			marginBottom: "0.5em",
		};
		return(
			<div>
				<div style={titleStyle} ref={(ref) => (this.textDiv = ref)} > {this.props.title} </div>
				<div ref={(ref) => (this.gaugeDiv = ref)} />
			</div>

		);
	}
}

export default D3AngularComponent;
