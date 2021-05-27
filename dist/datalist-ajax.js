/*
<auto-complete> web component (should work in any framework)

load script:
<script type="module" src="./dist/datalist-ajax.js"></script>

Create an <auto-complete> element with a child <input>.

The api attribute must be set to a REST API which receives JSON data.
${id} values are substituted with form values with the associated id.

<auto-complete
  id="optional-id"
  api="https://mysite/api/${query}"
  resultdata="dataset"
  resultname="id"
  querymin="2"
  inputdelay="500"
  optionmax="50"
  valid="please select a valid value"
>
  <input type="text" id="query" name="query" size="50" required />
</auto-complete>
*/
class AutoComplete extends HTMLElement {

  constructor() {

    super();

    // defaults
    this.cache = {};
    this.url = '';
    this.param = {};
    this.inputdelay = 300;
    this.querymin = 1;
    this.optionmax = 20;
    this.valid = '';
    this.lastQuery = '';

  }


  // component attributes
  static get observedAttributes() {

    return ['id', 'api', 'resultdata', 'resultname', 'inputdelay', 'querymin', 'optionmax', 'valid'];

  }


  // attribute change
  attributeChangedCallback(property, oldValue, newValue) {

    if (oldValue === newValue) return;
    this[property] = newValue;

    if (property === 'api') {

      // determine API parameters
      this.param = {};

      for (const match of this.api.matchAll(/\$\{(.+?)\}/g)) {

        const f = document.getElementById(match[1].trim());
        if (f) this.param[match[0]] = f;

      }

    }

  }


  // connect component
  connectedCallback() {

    this.input = this.firstElementChild;
    if (!this.input) return;

    const listId = (this.input.name || this.input.id) + 'list';

    // append datalist
    const list = document.createElement('datalist');
    list.id = listId;
    this.datalist = this.insertBefore(list, this.input);

    // link datalist to input
    this.input.setAttribute('autocomplete', 'off');
    this.input.setAttribute('list', listId);

    // attach debounced input handler
    let debounce;
    this.inputHandler = e => {

      clearTimeout(debounce);
      debounce = setTimeout(() => this.runQuery(e), this.inputdelay);

    };
    this.input.addEventListener('input', this.inputHandler);

    // check validity and update
    this.changeHandler = () => {

      // validate query value
      const data = this.isValid() || this.reset || {};

      this.input.setCustomValidity(data ? '' : this.valid);
      this.input.checkValidity();

      // update linked values
      let reset = {};
      for (const name in data) {

        Array.from(this.input.form.querySelectorAll(`[data-autofill="${ name }"], [data-autofill="${ this.id }.${ name }"]`)).forEach(f => {
          f.value = data[name] || '';
          reset[name] = '';
        });

      }

      this.reset = reset;

    };
    this.input.addEventListener('change', this.changeHandler);

  }


  // disconnect component
  disconnectedCallback() {

    this.input.removeEventListener('input', this.inputHandler);
    this.input.removeEventListener('blur', this.changeHandler);
    this.input.removeAttribute('list');
    this.datalist.remove();

  }


  // call API
  runQuery() {

    const
      query = this.input.value.trim().toLowerCase(),
      valid = this.isValid(),
      lq = this.lastQuery,
      cq = lq && this.cache[lq];

    // get API URL
    let url = this.api || '';
    for (const p in this.param) {
      url = url.replaceAll(p, (this.param[p].value || '').trim());
    }

    // new query necessary?
    if (!this.api || valid || query.length < this.querymin || (cq && cq.complete && cq.url === url && query.startsWith(lq))) return;

    if (this.cache[query] && this.cache[query].url === url) {

      // use cached data
      this.datalistUpdate( query );
      return;

    }

    // data fetch
    this.cache[query] = {};

    fetch(url)
      .then(res => res.json())
      .then(data => {

        if (!data) return;
        data = (this.resultdata && data[this.resultdata]) || data;
        data = Array.isArray(data) ? data : [ data ];

        // create fragment
        const frag = document.createDocumentFragment();
        let optMax = this.optionmax;

        for (let d = 0; d < data.length && optMax > 0; d++) {

          const value = data[d][this.resultname];

          if (value && value.toLowerCase().includes(query)) {
            const option = document.createElement('option');
            option.value = value;
            frag.appendChild(option);
            optMax--;
          }

        }

        // cache returned data
        this.cache[query] = { url, data, frag, complete: optMax > 0 };
        this.datalistUpdate( query );

      });

  }


  // update datalist
  datalistUpdate(query) {

    const c = this.cache[query];

    if (!c || !c.frag) return;

    this.lastQuery = query;
    this.datalist.replaceChildren( c.frag.cloneNode(true) );

  }


  // has a valid value been entered?
  isValid() {

    const query = this.input.value.trim();
    if (!query || !this.lastQuery) return;

    return this.cache[this.lastQuery].data.find(d => query === d[this.resultname]);

  }


}


// register component
window.customElements.define('auto-complete', AutoComplete);
