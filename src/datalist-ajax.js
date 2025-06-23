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

    return ['id', 'api', 'resultdata', 'resultname', 'inputdelay', 'querymin', 'optionmax', 'valid', 'storekeys'];

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

    const listId = (this.input.name || this.input.id) + '_list';

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
      const reset = {}, input = this.input, id = this.id;

      // recurse data values and populate autofill fields
      function autofill(obj, path = '') {

        if (Array.isArray(obj)) {
          obj.forEach((v, i) => autofill(v, `${ path }[${ i }]`));
        }
        else if (typeof obj === 'object') {
          for (const k in obj) {
            autofill(obj[k], `${ path + (path ? '.' : '') }${ k }`);
          }
        }
        else {

          Array.from(input.form.querySelectorAll(`[data-autofill="${ path }"], [data-autofill^="${ id }.${ path }"]`)).forEach(f => {
            f.value = String(obj) || '';
            reset[path] = '';
          });
        }

      }

      autofill(data);

      // trigger event
      const event = new CustomEvent('autofill', { detail: data });
      this.dispatchEvent(event);

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
        if (this.resultdata) {
          data = this.getNestedKeys(data, this.resultdata);
        }
        data = Array.isArray(data) ? data : [ data ];

        // create fragment
        const frag = document.createDocumentFragment();
        let optMax = this.optionmax;

        for (let d = 0; d < data.length && optMax; d++) {

          const value = this.resultname ? this.getNestedKeys(data[d], this.resultname) : data[d];
          const res = [];
          if (this.storekeys) {
            const keys = this.storekeys.split(',').map(e => e.trim());
            for (const k of keys) {
              const s_val = this.getNestedKeys(data[d], k);
              if (s_val !== undefined){
                res[k] = s_val;
              }
            }
          }

          if (value && value.toLowerCase().includes(query)) {
            const option = document.createElement('option');
            option.value = value;
            for (const k in res){
              option.setAttribute('data-' + k, res[k]);
            }
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

    return this.cache[this.lastQuery].data.find(d => query === this.getNestedKeys(d, this.resultname));

  }

  // find value of nested keys
  getNestedKeys(obj, key) {

    if (key in obj) return obj[key];

    const keys = key.split('.');
    let value = obj;
    for (let i = 0; i < keys.length; i++) {
      value = value[keys[i]];
      if (value === undefined) {
        break;
      }
    }

    return value;

  }

}


// register component
window.customElements.define('auto-complete', AutoComplete);
