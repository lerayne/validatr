/**
 * Created with IntelliJ IDEA.
 * User: M. Yegorov
 * Date: 10/10/14
 * Time: 12:22 PM
 * To change this template use File | Settings | File Templates.
 */

// проверка данных формы
// requires: jQuery > 1.5; bind
Validatr = function (config) {
	var $ = jQuery;
	bind(this);

	// наборы данных
	this.txt = {
		ru:{
			'err_required':'Это поле должно быть заполнено',
			'err_filetypes':'Выбран файл недопустимого типа',
			'err_required_box':'Этот флаг должен быть отмечен',
			'err_sysname':'Только латинские символы, цифры и _',
			'err_yyyy.MM.dd':'Нужна дата в формате yyyy.MM.dd',
			'err_phone':'От 7 до 20 знаков: только цифры, скобки, пробел, + и -',
			'err_number':'Требуется число',
			'err_email':'Требуется адрес e-mail',
			'err_eqref':'Пароли должны совпадать',
			'err_custom_exp': 'Неверный формат',
			'err_symbolsmin':'Слишком короткое значение',
			'err_symbolsmax':'Слишком длинное значение'
		},

		en:{
			'err_required':'This field is required',
			'err_filetypes':'Wrong file type',
			'err_required_box':'This box must be checked',
			'err_sysname':'Just a-z & _',
			'err_yyyy.MM.dd':'Expecting date in yyyy.MM.dd',
			'err_phone':'7 to 20 chars: numbers, brackets, + & -',
			'err_number':'Expecting number',
			'err_email':'Expecting valid e-mail',
			'err_eqref':'Passwords must match',
			'err_custom_exp': 'Wrong format',
			'err_symbolsmin':'Value is too short',
			'err_symbolsmax':'Value is too long'
		}
	}

	// добавлять объект customFuncs вручную после инициализации
	//this.customFuncs = (typeof functions == 'object') ? functions : {};

	// конфиг по умолчанию
	this.config = {
		form:false,
		passDisabled:false,
		language:'en',
		notform:false,
		submitFunction: false,
		validationOff:false,
		validateAllBtn:false
	};

	// загрузка конфига
	for (var i in config) this.config[i] = config[i];

	// базовые рабочие параметры
	this.valid = $([]);
	this.invalids = $([]);
	this.batchValidationsRemains = -1;
	this.submitIfPossible = false;

	this.form = config.form;
	this.submit = this.form.find('input[type="submit"]');
	this.elements =
		this.form.find('input[vldtr-enabled="true"], textarea[vldtr-enabled="true"], select[vldtr-enabled="true"]')
			.not(this.submit);

	// обработка случая, когда проверяется часть формы
	if (!this.form.is('form') || this.config.notform == true || !!this.config.validateAllBtn){
		this.submit = this.config.validateAllBtn;
	}

	// установка событий
	this.elements.change(this.resetSubmit);
	this.elements.change(this.validate);

	//this.submit.prop('disabled', false);
	this.submit.click(this.submitForm);

}

Validatr.prototype = {

	submitForm:function () {
//		console.log('submitForm');
		this.submitIfPossible = true;
		this.validateAll();
		return false;
	},

	resetSubmit:function(){
		this.submitIfPossible = false;
	},

	validate:function (e, elem) {

		if (typeof e == 'object') {
			var element = jQuery(e.currentTarget);
		} else if (!!elem) {
			var element = jQuery(elem);
			if (element.attr('vldtr-skipfinal')) {
				this.addToValid(element);
				return;
			}
		}

		// автоматическая валидация
		if ((this.config.passDisabled && element.attr('disabled')) || this.config.validationOff ) {
			this.addToValid(element); return;
		}

		if ((!element.is(':visible') && element.attr('type') != 'hidden' && element.attr('vldtr-checkhidden') != 'true') || !element.parent().is(':visible')){
			this.addToValid(element); return;
		}

		if (!!element.attr('vldtr-required') && element.prop('vldtr-required') != 'false') {

			if (!element.val() || element.val().match(/^\s*$/)) return this.invalid(element, 'err_required');
			// не помню, в каком случае нужна проверка на равенство нулю, но проверка на двоеточие нужна, чтобы время не приравнивалось к нулю
			if (element.val().indexOf(':') == -1 && parseInt(element.val(),10) == 0) return this.invalid(element, 'err_required');
			if (element.is('[type="checkbox"]') && !element.is(':checked')) return this.invalid(element, 'err_required_box');
			if (element.is('select') && (parseInt(element.val(),10) == 0 || parseInt(element.val(),10) == -1)) return this.invalid(element, 'err_required');
		}

		var filter = element.attr('vldtr-filter');
		if (!!filter) {

			switch (filter) {
				case 'sysname':
					var match = /^[a-zA-Z0-9._-]{1,}$/;
					break;
				case 'yyyy.MM.dd':
					var match = /^[0-9]{4,4}.[0-9]{2,2}.[0-9]{2,2}$/;
					break;
				case 'phone':
					var match = /^[ 0-9\)\(\+\-_]{7,20}$/;
					break;
				case 'number':
					var match = /^[0-9]{1,}$/;
					break;
				case 'email':
					var match = /^[-a-z0-9!#$%&'*+/=?^_`{|}~]+(?:\.[-a-z0-9!#$%&'*+/=?^_`{|}~]+)*@(?:[a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?\.)*(?:aero|arpa|asia|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel|[a-z][a-z])$/;
					break;
				/*case 'cent':
				 var match = /^[0-9]((.|,)[0-9]{0,2})??$/;
				 break;*/
				default:
					var match = new RegExp(filter);
					filter = 'custom_exp';

				//console.log('custom filter', match, element.val(), !!element.val().match(match), !!element.val().match(/^$/))
			}

			//console.log(element.attr('name'), match)
			if (!element.val().toLowerCase().match(match) && !element.val().match(/^$/)) return this.invalid(element, 'err_' + filter)
		}

		var eqref = element.attr('vldtr-eqref');
		if (!!eqref) {
			var ref = this.form.find(eqref);
			if (element.val() == ref.val()) {
				this.restore(element);
				this.restore(ref);
			} else return this.invalid(element, 'err_eqref')
		}

		if (element.is('[type="file"]') && element.attr('vldtr-filetypes')){
			var types = element.attr('vldtr-filetypes').split(',');

			if (!element.val().match(/^$/)){
				var val = element.val().split('.');
				var ext = val[val.length-1];
				if (types.indexOf(ext) == -1) return this.invalid(element, 'err_filetypes')
			}
		}

		var symbolsMin = element.attr('vldtr-symbolsmin');
		if (!!symbolsMin) {
			if (element.val().length < parseInt(symbolsMin,10)) return this.invalid(element, 'err_symbolsmin')
		}

		var symbolsMax = element.attr('vldtr-symbolsmax');
		if (!!symbolsMax) {
			if (element.val().length > parseInt(symbolsMax,10)) return this.invalid(element, 'err_symbolsmax')
		}

		var customCheck = element.attr('vldtr-funcname');

		if (customCheck && typeof this.customFuncs == 'object' && typeof this.customFuncs[customCheck] == 'function'){

			this.customFuncs[customCheck](element)

		} else {
			this.addToValid(element);
		}
	},

	addToValid:function(element){

		//console.log('added to valid: element with id = [', element.attr('id'), '] and name = [', element.attr('name'), ']')

		this.valid = this.valid.add(element);
		this.invalids = this.invalids.not(element);
		this.restore(element);

		var passed = (this.elements.size() == this.valid.size());

		if (passed && this.submitIfPossible) {
			if (typeof this.config.submitFunction == 'function') {
				console.log('fireing custom function')
				this.config.submitFunction();
			} else {
				console.log('standart submit')
				this.form.submit();
			}
		}

		this.validateNext();

		return false;
	},

	validateAll:function () {
		console.log('validateAll:', this.elements);
		this.valid = jQuery([]);
		this.invalids = jQuery([]);

		if (this.elements.size() > 0) {

			this.batchValidationsRemains = this.elements.size();
			this.validateNext();

		} else {
			this.addToValid(jQuery([]))
		}

		/*if (this.elements.size() != this.valid.size()) {
		 console.log('not all elemets is validated! elements:', this.elements.size(), ', checked:', this.valid.size())
		 }*/
	},



	validateNext:function(){
		if (this.batchValidationsRemains > 0){
			this.batchValidationsRemains--;
			//console.log('validateNext:', this.batchValidationsRemains)
			this.validate(0, this.elements.eq(this.batchValidationsRemains))
		}
	},

	invalid:function (element, err) {
		this.invalids = this.invalids.add(element);
		this.valid = this.valid.not(element);

		if (!element.attr('vldtr-backup-bcolor')) element.attr('vldtr-backup-bcolor', element.css('border-top-color'));

		var parent =  element.parent();
		var errMsg =  element.attr('vldtr-custom-errmsg') ? element.attr('vldtr-custom-errmsg') :
			typeof this.txt[this.config.language][err] != 'undefined' ? this.txt[this.config.language][err] : err;

		var messageContainer = element.attr('vldtr-errorPlaceId') ? jQuery('#'+element.attr('vldtr-errorPlaceId')) : element.parent();

		var errorMessage = messageContainer.find('.vldtr-error');

		if (errorMessage.size() == 0) {

			element.css('border-color', 'red');
			errorMessage = jQuery('<div class="vldtr-error">' +
				errMsg + '</div>');

			messageContainer.append(errorMessage);

			//errorMessage.width(parent.width());
			errorMessage.slideDown(100);

		} else {
			errorMessage.html(errMsg)
		}

		console.error('ERROR in field "' + element.prop('name') + '" with value "' + element.val() + '": ' + errMsg)
		this.validateNext();

		return false;
	},

	restore:function (element) {

		if (element.attr('vldtr-backup-bcolor')) element.css('border-color', element.attr('vldtr-backup-bcolor'));
		else element.css('border-color', '#bbb');

		if (element.attr('vldtr-errorPlaceId')){
			jQuery('#'+element.attr('vldtr-errorPlaceId')).find('.vldtr-error').remove();
		} else {
			element.parent().find('.vldtr-error').remove();
		}
	},

	setValidated:function (element) {
		console.log('force validate', element)
	},

	update:function(){
		this.elements =
			this.form.find('input[vldtr-enabled="true"], textarea[vldtr-enabled="true"], select[vldtr-enabled="true"]')
				.not(this.submit);

		//console.log('updated:', this.elements.size(), this.elements);

		this.elements.off('change');

		this.elements.change(this.resetSubmit);
		this.elements.change(this.validate);
	},

	areThereAnyInvalid:function(){

	}
}

jQuery(function(){

	window.validated = [];

	jQuery('.le-validated').each(function(){
		window.validated.push(new FormCheck({ form: jQuery(this) }))
	})
})

