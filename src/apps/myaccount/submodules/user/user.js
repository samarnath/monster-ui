define(function(require) {
	var $ = require('jquery'),
		_ = require('underscore'),
		chosen = require('chosen'),
		monster = require('monster'),
		timezone = require('monster-timezone');

	var user = {

		subscribe: {
			'myaccount.user.renderContent': '_userRenderContent'
		},

		_userRenderContent: function(args) {
			var self = this;

			monster.parallel({
				'user': function(callback) {
					self.callApi({
						resource: 'user.get',
						data: {
							accountId: monster.apps.auth.originalAccount.id,
							userId: self.userId
						},
						success: function(data, status) {
							callback && callback(null, data.data);
						}
					});
				},
				'countries': function(callback) {
					callback && callback(null, timezone.getCountries());
				}
			}, function(err, results) {
				var formattedData = self.userLayoutFormatData(results),
					userTemplate = $(monster.template(self, 'user-layout', formattedData));

				self.userBindingEvents(userTemplate, results);

				monster.pub('myaccount.renderSubmodule', userTemplate);

				if (typeof args.callback === 'function') {
					args.callback(userTemplate);
				}
			});
		},

		userLayoutFormatData: function(data) {
			var self = this;

			data.defaultNumbersFormat = self.i18n.active().numbersFormat[monster.util.getDefaultNumbersFormat()];

			if (!(data.user.hasOwnProperty('ui_flags') && data.user.ui_flags.hasOwnProperty('numbers_format'))) {
				data.user.ui_flags = data.user.ui_flags || {};
				data.user.ui_flags.numbers_format = 'inherit';
			}

			return data;
		},

		userBindingEvents: function(template, data) {
			var self = this;

			timezone.populateDropdown(template.find('#user_timezone'), data.user.timezone || 'inherit', {inherit: self.i18n.active().defaultTimezone});
			template.find('#user_timezone').chosen({ search_contains: true, width: '220px' });
			monster.ui.showPasswordStrength(template.find('#password'));

			template.find('#numbers_format_exceptions').chosen({ search_contains: true, width: '220px' });

			template.find('[name="ui_flags.numbers_format"]').on('change', function() {
				template.find('.group-for-exceptions').toggleClass('active', template.find('[name="ui_flags.numbers_format"]:checked').val() === 'international_with_exceptions');
			});

			monster.ui.tooltips(template);

			monster.pub('myaccount.events', {
				template: template,
				data: data
			});
		}
	};

	return user;
});
