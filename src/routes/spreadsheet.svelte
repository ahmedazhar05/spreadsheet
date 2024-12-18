<script lang="ts">
    import { createIndex, sheet_functions, sheet_functions_regexp, plain_mathematical_expression_regex } from '$lib';
	import { onMount } from 'svelte';

    // export let data: string[][] = [];
    export let rows = 5;
    export let cols = 4;
    let table: {
        input: string;
        value: number | string;
    }[][] = [];
    let active: [number, number] = [-1, -1];
    let edit: boolean = false;

    // creating sheets's top-horizontal-letter-indexes
    $: indexes = createIndex(cols).map(idx => idx.join(""));

    // onMount(() => {
    //     if(data.length !== 0) {
    //         // rows = data.length    >= 5 ? data.length    : 5;
    //         // cols = data[0].length >= 4 ? data[0].length : 4;
    //         rows = data.length;
    //         cols = data[0].length;
            
    //         // initializing table array object using the imported `data`
    //         for(let i = 0; i < data.length; i++){
    //             table.push([]);
    //             table = table;
    //             for(let j = 0; j < data[i].length; j++) {
    //                 table[i].push({
    //                     input: data[i][j],
    //                     get value() { return evaluate(this.input); }
    //                 });
                    
    //                 // data[i][j] = table[i][j].input;
    //                 // data[i] = data[i];
    //                 table[i] = table[i];
    //             }
    //         }
    //         data = data;
    //     }
    // });

    // adjusting table size according to the row and column count
    for(let i = 0; i < rows; i++) {
        if(table[i] === undefined) {
            table.push([]);
            table = table;
        }
        for(let j = table[i].length; j < cols; j++) {
            table[i].push({
                input: "",
                get value() { return evaluate(this.input); }
            });
            table[i] = table[i];
        }
    }

    // for(let i = table.length; i < rows; i++){
    //     table.push([]);
    //     table = table;
    //     const data_row_exists = data.length > 0 && data[i] !== undefined;
    //     for(let j = table[i].length; j < cols; j++) {
    //         const data_col_exists = data_row_exists && data[i][j] != undefined;

    //         let cell_value = "";
    //         if(data_col_exists) cell_value = data[i][j];
    //         table[i].push({
    //             input: cell_value,
    //             get value() { return evaluate(this.input); }
    //         });

    //         if(data_col_exists) {
    //             data[i][j] = table[i][j].input;
    //             data[i] = data[i];
    //         }
    //         table[i] = table[i];
    //     }
    //     if(data_row_exists) data = data;
    // }

    enum selector_type {
        RANGE = 4,
        CELL = 2,
        NONE = 0
    }

    function parse_selector(operation: (...nums: number[]) => number, selector = selector_type.NONE): ((..._: string[]) => string | number) {
        const sort = <T>(a: T, b: T) => b < a ? [b, a] : [a, b];
        switch(selector){
            case selector_type.NONE: return () => operation();
            case selector_type.CELL: return (c1: string, d1: string) => {
                    const char = indexes.indexOf(c1), digit = +d1 - 1;
                    const val = +table[digit][char].value;
                    // if(typeof val !== 'number') val = parseFloat(val);
                    return operation(val);
                }
            case selector_type.RANGE: return (c1: string, d1: string, c2: string, d2: string) => {
                    let chars: number[] = [], digits: number[] = [], out: number[] = [];
                    [c1, c2] = sort(c1, c2);
                    const [n1, n2] = sort(+d1, +d2);

                    // range of all characters
                    for(let i = indexes.indexOf(c1), j = indexes.indexOf(c2); i <= j; i++) chars.push(i);
                    // range of all digits
                    for(let j = n1 - 1; j < n2; j++) digits.push(j);
                    
                    // permutation of both characters and digits
                    for(const char of chars) {
                        for(const digit of digits) {
                            const val = +table[digit][char].value;
                            // if(typeof val !== 'number') val = parseFloat(val);
                            if(val) out.push(val);
                        }
                    }
                    
                    return operation(...out);
                }
            default: return (match: string) => match;
        }
    }
    
    // parse mathematical expressions into literal values
    function parse_expression(expr: string) {
        const operators = {
            '+': <T>(a: T, b: T) => {
                if(typeof a === 'string') return `${a}${b}`;
                else return +a + +b;
            },
            '-': <T>(a: T, b: T) => +a - +b,
            '*': <T>(a: T, b: T) => +a * +b,
            '/': <T>(a: T, b: T) => +a / +b,
            '%': <T>(a: T, b: T) => +a % +b
        }

        const get_cell_value = (cell_id: string) => +(parse_selector(v => v, selector_type.CELL).apply(null, cell_id.match(/[A-Z]+|\d+/g)?.slice(0, 2) ?? []))

        // const partial = (left: number) => (operator: (...nums: number[]) => number) => (right: number) => operator(left, right);
        const partial = (left: string) => (operator: keyof typeof operators) => (right: string) => {
            const left_operand  = isNaN(+left)  ? get_cell_value(left)  : +left;
            const right_operand = isNaN(+right) ? get_cell_value(right) : +right;
            const out = operators[operator](left_operand, right_operand);
            return typeof out === 'number' && isNaN(out) ? "" : out.toString();
        };

        function parse_bracketed_expression(match: string, expression: string): string {
            // evaluating innermost bracketed expressions first
            const resolved_expr = expression.replace(plain_mathematical_expression_regex, parse_bracketed_expression);
        
            const parts = resolved_expr.match(/[A-Z]+[1-9][0-9]*|\d+(?:\.\d+)?|[+*/%-]/g);
            if(parts?.join("") !== resolved_expr) return match;
        
            let accumulator: string | Function = partial;

            // validating that the first element in a mathematical expression should be a number
            // if(!(+parts[0] || get_cell_value(parts[0]))) return match;

            for(const part of parts) {
                if(typeof accumulator === 'string') accumulator = partial(accumulator);
                accumulator = accumulator(part);
            }
            return typeof accumulator === 'string' ? accumulator : match;
        }
        return `(${expr})`.replace(plain_mathematical_expression_regex, parse_bracketed_expression).replace(/^\(|\)$/gm, '');
    }
    
    // parse sheet's function-expressions and evaluate them into literal values
    function parse_functions(_: string, function_name: keyof typeof sheet_functions, ...selected: string[]) {
        const selector_type = selected.slice(0, -2).map(x => typeof x).lastIndexOf('string') + 1;
        return parse_selector(sheet_functions[function_name], selector_type)(...selected).toString();
    }

    // evaluate non-literal(functions) values into literal values
    function evaluate (input: string): string | number {
        const number_representation = parseFloat(input);
        if(!isNaN(number_representation)) return number_representation;
        else if(!input.startsWith('=')) return input;
        return parse_expression(input
            .slice(1)
            .toUpperCase()
            .replace(sheet_functions_regexp, parse_functions));
    }

    function insert(insert_row?: boolean) {
        if(insert_row != undefined){
            // either insert row or insert column
            if(insert_row) {
                table.push(Array(cols).fill(null).map(() => ({
                    input: "",
                    get value() { return evaluate(this.input); }
                })));
                table = table;
                ++rows;
            } else {
                for(let i = 0; i < table.length; i++) {
                    table[i].push({
                        input: "",
                        get value() { return evaluate(this.input); }
                    });
                    table[i] = table[i];
                }
                ++cols;
            }
        } else {
            // insert both
            insert(false);
            insert(true);
        }

        // synchronizing the imported `data` using the table
        // if(data.length > 0 && (data.length !== rows || data[0].length !== cols)) {
        //     for(let i = 0; i < rows; i++) {
        //         if(data[i] === undefined) data.push([]);
        //         for(let j = 0; j < cols; j++) {
        //             if(data[i][j] === undefined) data[i].push(table[i][j].input);
        //             else data[i][j] = table[i][j].input;
        //         }
        //         data[i] = data[i];
        //     }
        //     data = data;
        // }
    }

    function handle_sheet_navigation(event: KeyboardEvent) {
        const is_cell_active = active.toString() !== '-1,-1';
        if(is_cell_active) {
            if (event.code === "Escape") {
                edit = false;
            } else if(event.code === 'Enter') {
                edit = !edit;
            } else if(!edit) {
                if(event.code.startsWith("Arrow")){
                    switch(event.code.slice(5)) {
                        case "Up": active[0] -= 1; break;
                        case "Down": active[0] += 1; break;
                        case "Left": active[1] -= 1; break;
                        case "Right": active[1] += 1; break;
                    }
                    active[0] = (active[0] + rows) % rows;
                    active[1] = (active[1] + cols) % cols;
                } else if (['Key', 'Numpad', 'Digit', 'Minus', 'Equal' /*, 'Enter' */, 'Period', 'Comma', 'Space'].filter(keyword => event.code.startsWith(keyword)).length > 0) {
                    edit = true;
                } else if (['Delete', 'Backspace', 'Escape'].filter(keyword => event.code.startsWith(keyword)).length > 0) {
                    table[active[0]][active[1]].input = "";
                }
            }
        }
    }
</script>

<svelte:window
    on:keydown={handle_sheet_navigation}
/>

<table class:edit>
    <tbody>
        <tr>
            <th class="filler"></th>
            {#each Array(cols) as _, col_index}
            <th class="col index" class:active={active[1] === col_index}>{indexes[col_index]}</th>
            {/each}
            <!-- <th class="filler"></th> -->
        </tr>
        {#each table as row, row_index}
        <tr>
            <th class="row index"class:active={active[0] === row_index}>{row_index + 1}</th>
            {#each row as _, col_index}
            <td
                class:active={active.toString() === `${row_index},${col_index}`}
                on:click={() => active = [row_index, col_index]}
                on:dblclick={() => {
                    active = [row_index, col_index];
                    edit = true;
                }}
            >
                {#if edit && active.toString() ===`${row_index},${col_index}`}
                <div class="editor">
                    <input 
                        autofocus
                        type="text"
                        bind:value={table[row_index][col_index].input}
                        on:focusout={() => edit = false }
                    >
                </div>
                {:else}
                <div class="value">{table[row_index][col_index].value}</div>
                {/if}
            </td>
            {/each}
            {#if row_index == 0}
            <th rowspan="{rows}" class="insert" on:click={() => insert(false)}></th>
            {/if}
        </tr>
        {/each}
        <tr>
            <th class="filler"></th>
            <th colspan="{cols}" class="insert" on:click={() => insert(true)}></th>
            <th class="insert" on:click={() => insert()}></th>
        </tr>
    </tbody>
</table>

<style>
    table, td, th {
        border-collapse: collapse;
        font-size: 1.4em;
    }
    
    td, th:not(:first-child) {
        border: 1px solid darkgray;
        width: 200px;
        max-width: 200px;
        overflow: hidden;
        height: 60px;

        & > .editor {
            display: flex;
            width: 100%;
            height: 100%;
            overflow: hidden;

            & > input {
                width: 100%;
                height: 100%;
                border: none;
                outline: none;
                font-size: 1em;
                padding: 0;
            }
        }
    }

    :is(td, th).filler {
        border: none;
    }

    th {
        &.index {
            width: max-content;
            min-width: 90px;
            max-width: max-content;
            border: none;

            &.active {
                background-color: var(--theme);
                /* color: black; */
            }
        }
        
        &.insert {
            position: relative;
            max-width: 3ch;
            border: none;

            &:hover {
                background-color: var(--theme);
            }

            &::before {
                content: '\002B';
                display: flex;
                width: 100%;
                justify-content: center;
                align-items: center;
            }
        }
    }
    
    td {
        background-color: var(--background-color, white);
        color: var(--color, black);
        cursor: cell;

        & .value {
            user-select: none;
        }

        &.active {
            outline: 3px solid black;
            outline-offset: -2px;
        }
    }
    
    table.edit td.active {
        outline-color: var(--theme);
    }

    /* table {
        & td {
            background-color: var(--background-color, white);
            color: var(--color, black);
            cursor: cell;
        }
        & td.active {
            outline: 3px solid black;
            outline-offset: -2px;
        }
        &.edit td.active {
            outline-color: var(--theme);
        }
    } */
</style>