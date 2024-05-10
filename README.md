# datalist-ajax: HTML5 Ajax auto-complete

An auto-complete module which implements Ajax REST calls and updates lightweight HTML5 `<datalist>` elements.

Load `demo.html` to view the demonstration page. This allows you to select a country (the form can only be submitted if a valid option is chosen). A music artist auto-complete then returns artists with names that match the search string who originated in the chosen country.

* the country look-up API is provided by [restcountries.com](https://restcountries.com/)
* the music artist look-up API is provided by [musicbrainz.org](https://musicbrainz.org/doc/MusicBrainz_API)

**NOTE:** this started as demonstration code for the [SitePoint article "Lightweight Autocomplete Controls with the HTML5 Datalist"](https://www.sitepoint.com/html5-datalist-autocomplete/). Many developers found it useful and submitted suggestions and updates. You're welcome to use it at your own risk without 24/7 support!


## Version history

### 1.0.3: 10 May 2024

Rollup of various updates including options to extract nested values, update data attributes, fix demonstration, and modify documentation.


### 1.0.0: 23 January 2021

Initial release.


## Usage

Load the script anywhere in your HTML page as an ES6 module (3Kb):

```html
<script type="module" src="./dist/datalist-ajax.min.js"></script>
```

or using the CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/datalist-ajax/dist/datalist-ajax.min.js"></script>
```

Create an `<auto-complete>` element with a child `input` to use as the data-entry field, e.g.

```html
<label for="country">country lookup:</label>

<auto-complete
  id="countryauto"
  api="https://restcountries.com/v3.1/name/${country}?fields=name,cca2,region"
  resultname="name.common"
  querymin="2"
  optionmax="50"
  valid="please select a valid country"
  storekeys="key1,key2"
>
  <input type="text" id="country" name="country" size="50" required />
</auto-complete>
```

`<auto-complete>` attributes:

| attribute | description |
| -: | - |
|         `id` | optional ID (only necessary when two or more controls could [auto-fill an input](#auto-fill-other-inputs)) |
|        `api` | REST URL (required) |
| `resultdata` | the name of the property containing a result array of objects in the returned API JSON (not required if only results are returned) |
| `resultname` | the name of the property in each result object which matches the search input and is used for datalist `<option>` elements (optional) |
|   `querymin` | the minimum number of characters to enter before a search occurs (default: 1) |
| `inputdelay` | the minimum time to wait in milliseconds between keypresses before a search occurs (default debounce: 300) |
|  `optionmax` | the maximum number of auto-complete options to show (default: 20) |
|      `valid` | if set, this error message is shown when an invalid value is selected |
|  `storekeys` | if set to a comma-delimited list of result values, e.g. `storekeys="id,name"`, the <options> element has associated `data-` attributes defined which can be accessed by the [dataset property](https://developer.mozilla.org/docs/Web/API/HTMLElement/dataset).|


### REST URL input identifiers

The REST URL must contain at least one `${id}` identifier which is substituted by the value set in the input field with that `id`.

In the example above, `${country}` references the value held in the child `<input>`. The URL will normally reference its child input's `id` but any other fields on the page can also be added.


### API JSON result example 1

The API URL must return JSON data with a single object or an array of objects with at least one property to use in the auto-complete choice list.

```json
[
  {
    "name": "string one",
    "type": "string",
    "date": "2021-01-01"
  },
  {
    "name": "string two",
    "type": "string",
    "date": "2021-01-02"
  },
  {
    "name": "string three",
    "type": "string",
    "date": "2021-01-03"
  }
]
```

In this case:

* only a result array is returned so the `resultdata` attribute need not be set
* the `resultname` attribute must be set to `"name"` so the auto-complete list shows "string one", "string two", and "string three" as choices.


### API JSON result example 2

Another example with nested values:

```json
{
  "title": "some data",
  "query": "str",
  "resultset": [
    {
      "name": { "full": "string one", "short": "one" },
      "type": "string",
      "date": "2021-01-01"
    },
    {
      "name": { "full": "string two", "short": "two" },
      "type": "string",
      "date": "2021-01-02"
    },
    {
      "name": { "full": "string three", "short": "three" },
      "type": "string",
      "date": "2021-01-03"
    }
  ]
}
```

In this case:

* the `resultdata` attribute must be set to `"resultset"` so the result array can be located
* the `resultname` attribute must be set to `"name.full"`.


### API JSON result example 3

Another example:

```json
{
  "SuggestionResult": [
    "Doornikstraat, Lochristi",
    "Doornikstraat, Oudenaarde",
    "Doornikstraat, Brussel"
  ]
}
```

In this case:

* the `resultdata` attribute must be set to `"SuggestionResult"` so the result array can be located
* the `resultname` attribute must be omitted


### API JSON result example 4

Example with a deeply nested result set:

```json
{
  "_embedded": {
    "companies": [
      { "number": 1337, "name": "MakePlans"},
      { "number": 9999, "name": "GitHub"}
    ]
  }
}
```

In this case:

* the `resultdata` attribute must be set to `"_embedded.compamies"` so the result array can be located
* the `resultname` attribute must be set to `"name"`.


### Auto-fill other inputs

When a valid value is selected, any of the data items can be placed into other input fields within the same form by referencing the property name in a `data-autofill` attribute.

For example, this hidden field will have its value set to `"2021-01-02"` when "string two" is chosen:

```html
<input type="hidden" name="date" data-autofill="date" />
```

In cases where two or more APIs return the same data names, `data-autofill` can be namespaced with the `id` assigned to a single `<auto-complete>`. In the following example, the `region` field can only be auto-filled by `region` data returned by the `<auto-complete>` with an `id` of `"countryauto"`. Any other API returning `region` data is ignored.

```html
<auto-complete id="countryauto" ...>
</auto-complete>

<input name="region" data-autofill="countryauto.region" />
```

### Events

The component triggers an `autofill` event with the selected data in `detail`.


### Populating `<option>` elements with data

If set additional data from the query result is filled to the `<option>` tag of the underlying datalist:

Query result:

```json
[
  {
    "name": "George Orwell",
    "id": "1984",
    "born": "1903-06-25"
  },
  {
    "name": "Bruce Wayne",
    "id": "17",
    "born": "1939-05-27",
    "foo": "bar"
  },
  {
    "name": "Nobody",
    "id": "0"
  }
]
```

Initial HTML:

```html
<auto-complete storekeys='id,born' resultname='name' ...>
<input id="person" />
</auto-complete>
```

HTML after population from REST API call:

```html
<input id="person" list="person_list">
<datalist id='person_list'>
	<option value='George Orwell' data-id='1984' data-born='1903-06-25' />
	<option value='Bruce Wayne' data-id='17' data-born='1939-05-27' />
	<option value='Nobody' data_id='0' />
</datalist>
```


## Building

The minified script is built using [Rollup.js](https://rollupjs.org/) and [Terser](https://terser.org/). Install and build:

```bash
npm i
npm run build
```
