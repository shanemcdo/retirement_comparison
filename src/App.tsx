import type { Component, Ref, Accessor, Setter } from 'solid-js';

import { createSignal, onMount, createUniqueId, For } from 'solid-js';
import { Chart, Title, Tooltip, Legend, Colors } from 'chart.js'
import { Line } from 'solid-chartjs'
import styles from './App.module.css';

type Data = {
	name: string,
	points: {
		year: number,
		value: number,
		principal: number,
		totalInterest: number,
		spending: number,
		interestPerYear: number,
	}[],
};

type Inputs = {
	name: string,
	startingAge: number,
	startingBalance: number,
	interestRate: number,
	retirementAge: number,
	maxAge: number,
	startingInvestmentPerMonth: number,
	investmentIncreasingRate: number,
	spendingPerYear: number,
};

type NumberInputProps = {
	defaultValue: number | string,
	name: string,
	ref: Ref<HTMLInputElement>,
	updateData: () => void,
	type?: string,
	index: number,
};

type NumberInputsProps = {
	setData: Setter<Data>,
	defaults?: Partial<Inputs>,
	index: number,
};

function calculateData(
	name: string,
	startingAge: number,
	startingBalance: number,
	interestRatePercent: number,
	retirementAge: number,
	maxAge: number,
	startingInvestmentPerMonth: number,
	investmentIncreasingRatePercent: number,
	spendingPerYear: number
): Data {
	let currentAge = startingAge;
	let currentBalance = startingBalance;
	let currentInvestmentPerMonth = startingInvestmentPerMonth;
	let principal = startingBalance;
	let interestPerYear = 0;
	let totalInterest = 0;
	let spending = 0;
	const monthlyInterestRate = interestRatePercent / 100 / 12;
	const monthlySpending = spendingPerYear / 12;
	const data: Data = {
		name,
		points: [],
	};
	while(currentAge < maxAge) {
		data.points.push({
			year: currentAge,
			value: currentBalance,
			principal,
			totalInterest,
			spending,
			interestPerYear,
		});
		if(currentBalance < 0) {
			break;
		}
		for(let i = 0; i < 12; i++) {
			if(currentAge < retirementAge) {
				principal += currentInvestmentPerMonth;
				currentBalance += currentInvestmentPerMonth;
			} else {
				spending += monthlySpending;
				currentBalance -= monthlySpending;
			}
			interestPerYear = currentBalance * monthlyInterestRate;
			totalInterest += interestPerYear;
			currentBalance *= 1 + monthlyInterestRate;
		};
		currentInvestmentPerMonth *= 1 + investmentIncreasingRatePercent / 100;
		currentAge += 1;
	}
	console.log(data);
	return data;
}

function getURL(): URL {
	return new URL(window.location.toString());
}

function updateURL(newurl: URL) {
	const urlstring = newurl.toString();
	window.history.pushState({ path: urlstring },'',urlstring);
}

function setURLParam(name: string, value: string) {
	const url = getURL();
	url.searchParams.set(name, value);
	updateURL(url);
}

function deleteURLParam(name: string) {
	const url = getURL();
	url.searchParams.delete(name);
	updateURL(url);
}

function getURLParam(name: string): string | null {
	const url = getURL();
	return url.searchParams.get(name);
}

// TODO: rename this shit
const NumberInput: Component<NumberInputProps> = props => {
	const id = createUniqueId();
	const name = () => `${props.index}.${props.name}`;
	return <>
		<label for={id} >{ props.name }:</label>
		<input
			type={props.type ?? "number"}
			value={getURLParam(name()) ?? props.defaultValue}
			class={styles.number_input}
			ref={props.ref}
			id={id}
			onChange={(e) => {
				if(e.target.valueAsNumber === props.defaultValue) {
					deleteURLParam(name())
				} else {
					setURLParam(name(), e.target.value);
				}
				props.updateData();
			}}
		/>
	</>;
}

const NumberInputs: Component<NumberInputsProps> = props => {
	let nameInput: HTMLInputElement | undefined;
	let startingAgeInput: HTMLInputElement | undefined;
	let startingBalanceInput: HTMLInputElement | undefined;
	let interestRateInput: HTMLInputElement | undefined;
	let retirementAgeInput: HTMLInputElement | undefined;
	let maxAgeInput: HTMLInputElement | undefined;
	let startingInvestmentPerMonthInput: HTMLInputElement | undefined;
	let investmentIncreasingRateInput: HTMLInputElement | undefined;
	let spendingPerYearInput: HTMLInputElement | undefined;
	const updateData = () => {
		props.setData(calculateData(
			nameInput!.value,
			startingAgeInput!.valueAsNumber,
			startingBalanceInput!.valueAsNumber,
			interestRateInput!.valueAsNumber,
			retirementAgeInput!.valueAsNumber,
			maxAgeInput!.valueAsNumber,
			startingInvestmentPerMonthInput!.valueAsNumber,
			investmentIncreasingRateInput!.valueAsNumber,
			spendingPerYearInput!.valueAsNumber,
		));
	}
	onMount(updateData);
	return <>
		<div class={styles.grid}>
			<NumberInput index={props.index} name="Name" type="string"             defaultValue={props.defaults?.name ?? 'Albert'}                  ref={nameInput}                       updateData={updateData}/>
			<NumberInput index={props.index} name="Starting age"                   defaultValue={props.defaults?.startingAge ?? 20}                 ref={startingAgeInput}                updateData={updateData}/>
			<NumberInput index={props.index} name="Starting Balance"               defaultValue={props.defaults?.startingBalance ?? 0}              ref={startingBalanceInput}            updateData={updateData}/>
			<NumberInput index={props.index} name="Interest Rate (%)"              defaultValue={props.defaults?.interestRate ?? 10}                ref={interestRateInput}               updateData={updateData}/>
			<NumberInput index={props.index} name="Retirement Age"                 defaultValue={props.defaults?.retirementAge ?? 50}               ref={retirementAgeInput}              updateData={updateData}/>
			<NumberInput index={props.index} name="Max Age"                        defaultValue={props.defaults?.maxAge ?? 120}                     ref={maxAgeInput}                     updateData={updateData}/>
			<NumberInput index={props.index} name="Starting Investment Per Month"  defaultValue={props.defaults?.startingInvestmentPerMonth ?? 500} ref={startingInvestmentPerMonthInput} updateData={updateData}/>
			<NumberInput index={props.index} name="Investment Increasing Rate (%)" defaultValue={props.defaults?.investmentIncreasingRate ?? 1}     ref={investmentIncreasingRateInput}   updateData={updateData}/>
			<NumberInput index={props.index} name="Spending Per Year Input"        defaultValue={props.defaults?.spendingPerYear ?? 100_000}        ref={spendingPerYearInput}            updateData={updateData}/>
		</div>
	</>;
};

const App: Component = () => {
	const [datasets, setDatasets] = createSignal<{
		id: number,
		data: Accessor<Data>,
		setData: Setter<Data>,
	}[]>([]);
	let dataID = 0;
	const addDataset = () => {
		const [data, setData] = createSignal<Data>({ name: 'test', points: [] });
		setDatasets([ ...datasets(), { id: dataID++, data, setData } ]);
	}
	onMount(() => {
		Chart.register(Title, Tooltip, Legend, Colors);
		Chart.defaults.font.family = '"Josefin Sans", sans-serif';
		addDataset();
		// TODO: read search params and parse here
	});
	const chartData = () => {
		const datasetsArray = [];
		for (const { data } of datasets()) {
			datasetsArray.push({
				label: data().name,
				data: data().points.map(({ year, value }) => ({ x: year, y: value})),
			});
		}
		return {
			// TODO: fix labels
			datasets: datasetsArray,
		};
	}
	const chartOptions = {
		//responsive: true,
		maintainAspectRatio: false,
		animation: {
			duration: 0,
		},
		scales: {
			y: { 
				min: 0,
			},
			x: {
				type: 'linear',
			},
		},
	};
	// TODO: make chart the right height
	// TODO: add button for adding more people
	return <div class={styles.app}>
		<h1>Retirement Comparison Calculator</h1>
		<div class={styles.grid_container}>
			<For each={datasets()}>{ ({ setData }, index) =>
				<NumberInputs setData={setData} index={index()} />
			}</For>
			<button onclick={addDataset}>+</button>
		</div>
		<div class={styles.chart_container} >
			<Line
				data={chartData()}
				options={chartOptions}
				onclick={() => {
				}}
			/>
		</div>
	</div>;
};

export default App;
