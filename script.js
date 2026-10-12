(function () {
  'use strict';

  var STORAGE_KEY = 'personalExpenseBuddy.state.v1';
  var APP_KEY = 'webapp_personalExpenseBuddy';
  var APP_VERSION = '001.001';
  var CATEGORIES = ['Housing', 'Utilities', 'Groceries', 'Dining', 'Transport', 'Health', 'Education', 'Shopping', 'Entertainment', 'Family', 'Subscriptions', 'Misc'];
  var PAYMENT_METHODS = ['Cash', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Other'];
  var SORT_OPTIONS = [
    { value: 'date-desc', label: 'Date (Newest)' },
    { value: 'date-asc', label: 'Date (Oldest)' },
    { value: 'amount-desc', label: 'Amount (High-Low)' },
    { value: 'amount-asc', label: 'Amount (Low-High)' }
  ];
  var SECTION_NAV_ITEMS = [
    { target: 'chartsSection', icon: 'barChart', label: 'Overview' },
    { target: 'limitsSection', icon: 'target', label: 'Spending by Category' },
    { target: 'membersSection', icon: 'users', label: 'Members' },
    { target: 'expensesSection', icon: 'list', label: 'Expenses' },
    { target: 'exportSection', icon: 'download', label: 'Export' }
  ];
  var EPS = 0.01;

  var ICONS = Buddy.ICONS;

  var CATEGORY_ICONS = {
    Housing: Buddy.ICONS.house,
    Utilities: Buddy.ICONS.zap,
    Groceries: Buddy.icon('shoppingCart'),
    Dining: Buddy.ICONS.utensils,
    Transport: Buddy.ICONS.transport,
    Health: Buddy.icon('activity'),
    Education: Buddy.icon('bookOpen'),
    Shopping: Buddy.ICONS.shoppingBag,
    Entertainment: Buddy.ICONS.entertainment,
    Family: Buddy.ICONS.users,
    Subscriptions: Buddy.ICONS.repeat,
    Misc: Buddy.ICONS.misc
  };

  function categoryIcon(name) {
    return CATEGORY_ICONS[name] || CATEGORY_ICONS.Misc;
  }




  var CATEGORY_SERIES = {
    Housing: '--series-1',
    Utilities: '--series-2',
    Groceries: '--series-3',
    Dining: '--series-4',
    Transport: '--series-5',
    Health: '--series-6',
    Education: '--series-7',
    Shopping: '--series-8'
  };

  function categoryColor(name) {
    var slot = CATEGORY_SERIES[name];
    return slot ? 'var(' + slot + ')' : 'var(--color-text-muted)';
  }

  var state = loadState();
  var filters = { category: '', member: '', sort: 'date-desc' };

  var dom = {};

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheDom();
    initStaticIcons();
    applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
    bindGlobalEvents();
    render();
  }

  function initStaticIcons() {
    dom.btnExportData.innerHTML = ICONS.download;
    dom.fileImportData.parentElement.insertAdjacentHTML('afterbegin', ICONS.upload);
    dom.btnSettings.innerHTML = ICONS.settings;

    SECTION_NAV_ITEMS.forEach(function (item) {
      var btn = dom.sectionNav.querySelector('[data-target="' + item.target + '"]');
      if (btn) btn.innerHTML = ICONS[item.icon] + '<span>' + escapeHtml(item.label) + '</span>';

      var section = document.getElementById(item.target);
      var heading = section ? section.querySelector('.section-header h2') : null;
      if (heading) heading.innerHTML = ICONS[item.icon] + heading.innerHTML;
    });
  }

  function cacheDom() {
    dom.budgetSearch = document.getElementById('budgetSearch');
    dom.budgetList = document.getElementById('budgetList');
    dom.btnAddBudget = document.getElementById('btnAddBudget');
    dom.sidebarLoadSampleHint = document.getElementById('sidebarLoadSampleHint');
    dom.linkLoadSampleSidebar = document.getElementById('linkLoadSampleSidebar');
    dom.btnSettings = document.getElementById('btnSettings');
    dom.btnExportData = document.getElementById('btnExportData');
    dom.fileImportData = document.getElementById('fileImportData');

    dom.emptyState = document.getElementById('emptyState');
    dom.budgetDetailContent = document.getElementById('budgetDetailContent');
    dom.budgetHeader = document.getElementById('budgetHeader');

    dom.budgetStats = document.getElementById('budgetStats');

    dom.membersList = document.getElementById('membersList');
    dom.membersEmpty = document.getElementById('membersEmpty');

    dom.filterCategory = document.getElementById('filterCategory');
    dom.filterMember = document.getElementById('filterMember');
    dom.sortExpenses = document.getElementById('sortExpenses');
    dom.expensesBody = document.getElementById('expensesBody');
    dom.expensesEmpty = document.getElementById('expensesEmpty');

    dom.btnManageLimits = document.getElementById('btnManageLimits');
    dom.categoryComposition = document.getElementById('categoryComposition');
    dom.limitCards = document.getElementById('limitCards');
    dom.limitAlerts = document.getElementById('limitAlerts');

    dom.btnExportSummaryCsv = document.getElementById('btnExportSummaryCsv');
    dom.btnExportExpensesCsv = document.getElementById('btnExportExpensesCsv');
    dom.btnExportLimitsCsv = document.getElementById('btnExportLimitsCsv');
    dom.btnExportPdf = document.getElementById('btnExportPdf');

    dom.printArea = document.getElementById('printArea');

    dom.sectionNav = document.getElementById('sectionNav');
  }

  function bindGlobalEvents() {
    dom.budgetSearch.addEventListener('input', function () { renderBudgetList(); });
    dom.btnAddBudget.addEventListener('click', openAddBudgetModal);
    dom.linkLoadSampleSidebar.addEventListener('click', handleLoadSample);
    dom.btnSettings.addEventListener('click', openSettingsModal);
    dom.btnExportData.addEventListener('click', openExportDataModal);
    dom.fileImportData.addEventListener('change', handleImportFile);
    dom.btnManageLimits.addEventListener('click', function () {
      var budget = getSelectedBudget();
      if (budget) openManageLimitsModal(budget);
    });

    dom.sectionNav.querySelectorAll('.section-nav-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = document.getElementById(btn.getAttribute('data-target'));
        if (target) {
          var reducedMotion = window.Buddy && Buddy.theme && Buddy.theme.isMotionReduced();
          target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
        }
      });
    });

    dom.btnExportSummaryCsv.addEventListener('click', function () { exportSummaryCsv(getSelectedBudget()); });
    dom.btnExportExpensesCsv.addEventListener('click', function () { exportExpensesCsv(getSelectedBudget()); });
    dom.btnExportLimitsCsv.addEventListener('click', function () { exportLimitsCsv(getSelectedBudget()); });
    dom.btnExportPdf.addEventListener('click', function () { exportPdf(getSelectedBudget()); });


    document.addEventListener('click', function (e) {
      document.querySelectorAll('.dropdown.open').forEach(function (dd) {
        if (dd.contains(e.target)) return;
        dd.classList.remove('open');
        var menu = dd.querySelector('.dropdown-menu');
        if (menu) menu.hidden = true;
        var toggle = dd.querySelector('.dropdown-toggle');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      });
    });




    document.addEventListener('mouseover', function (e) {
      var target = e.target.closest('[data-tooltip]');
      if (target) showTooltip(target);
    });
    document.addEventListener('mouseout', function (e) {
      var target = e.target.closest('[data-tooltip]');
      if (target && (!e.relatedTarget || !target.contains(e.relatedTarget))) hideTooltip();
    });
    document.addEventListener('scroll', hideTooltip, true);
  }



  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { budgets: [], selectedBudgetId: null };
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.budgets)) return { budgets: [], selectedBudgetId: null };
      return parsed;
    } catch (err) {
      console.error('Failed to load saved data, starting fresh.', err);
      return { budgets: [], selectedBudgetId: null };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function applyTheme(theme) {
    Buddy.theme.applyTheme(APP_KEY, theme);
  }

  function applyAccent(accent) {
    Buddy.theme.applyAccent(APP_KEY, accent);
  }

  function openSettingsModal() {
    Buddy.settings.open(APP_KEY, openModal, closeModal, { appVersion: APP_VERSION });
  }



  var TOOLTIP_GAP = 9;
  var TOOLTIP_MARGIN = 8;

  function getTooltipEl() {
    var el = document.getElementById('appTooltip');
    if (!el) {
      el = document.createElement('div');
      el.id = 'appTooltip';
      el.className = 'app-tooltip';
      el.setAttribute('role', 'tooltip');
      el.innerHTML = '<span class="app-tooltip-text"></span><span class="app-tooltip-arrow"></span>';
      document.body.appendChild(el);
    }
    return el;
  }




  function showTooltip(target) {
    var text = target.getAttribute('data-tooltip');
    if (!text) return;

    var tooltip = getTooltipEl();
    tooltip.querySelector('.app-tooltip-text').textContent = text;
    tooltip.classList.remove('below');

    var triggerRect = target.getBoundingClientRect();
    var tooltipRect = tooltip.getBoundingClientRect();

    var left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    var maxLeft = window.innerWidth - tooltipRect.width - TOOLTIP_MARGIN;
    left = Math.max(TOOLTIP_MARGIN, Math.min(left, maxLeft));

    var below = triggerRect.top - tooltipRect.height - TOOLTIP_GAP < TOOLTIP_MARGIN;
    var top = below ? triggerRect.bottom + TOOLTIP_GAP : triggerRect.top - tooltipRect.height - TOOLTIP_GAP;

    var arrowLeft = triggerRect.left + triggerRect.width / 2 - left;
    arrowLeft = Math.max(12, Math.min(arrowLeft, tooltipRect.width - 12));

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    tooltip.querySelector('.app-tooltip-arrow').style.left = arrowLeft + 'px';
    tooltip.classList.toggle('below', below);
    tooltip.classList.add('visible');
  }

  function hideTooltip() {
    var tooltip = document.getElementById('appTooltip');
    if (tooltip) tooltip.classList.remove('visible');
  }



  function uid() {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  function round2(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  function formatCurrency(n) {
    return Buddy.formatCurrency(n);
  }

  function formatDate(dateStr) {
    return Buddy.formatDate(dateStr);
  }

  function escapeHtml(str) {
    return Buddy.escapeHtml(str);
  }

  function getSelectedBudget() {
    return state.budgets.find(function (b) { return b.id === state.selectedBudgetId; }) || null;
  }

  function findMember(budget, id) {
    return budget.members.find(function (m) { return m.id === id; }) || null;
  }

  function budgetTotal(budget) {
    return round2(budget.expenses.reduce(function (sum, e) { return sum + e.amount; }, 0));
  }

  function downloadFile(filename, content, mime) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function csvEscape(val) {
    var s = String(val == null ? '' : val);
    if (/[",\n]/.test(s)) {
      s = '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function toCsv(rows) {
    return rows.map(function (row) { return row.map(csvEscape).join(','); }).join('\r\n');
  }



  function computeCategoryTotals(budget) {
    var totals = {};
    budget.expenses.forEach(function (exp) {
      totals[exp.category] = round2((totals[exp.category] || 0) + exp.amount);
    });
    return totals;
  }

  function computeMemberTotals(budget) {
    var totals = {};
    budget.members.forEach(function (m) { totals[m.id] = 0; });
    budget.expenses.forEach(function (exp) {
      if (totals.hasOwnProperty(exp.paidBy)) totals[exp.paidBy] = round2(totals[exp.paidBy] + exp.amount);
    });
    return totals;
  }

  function computeAvgPerDay(budget) {
    if (budget.expenses.length === 0) return 0;
    var dates = budget.expenses.map(function (e) { return e.date; }).filter(Boolean).sort();
    if (dates.length === 0) return budgetTotal(budget);
    var first = new Date(dates[0] + 'T00:00:00');
    var last = new Date(dates[dates.length - 1] + 'T00:00:00');
    var days = Math.max(1, Math.round((last - first) / 86400000) + 1);
    return budgetTotal(budget) / days;
  }




  function computeCategoryBreakdown(budget) {
    var total = budgetTotal(budget);
    var spentByCategory = computeCategoryTotals(budget);
    var limits = budget.categoryLimits || {};

    return CATEGORIES
      .filter(function (cat) { return (spentByCategory[cat] || 0) > 0 || (limits[cat] || 0) > 0; })
      .map(function (cat) {
        var spent = spentByCategory[cat] || 0;
        var limit = limits[cat] || 0;
        var hasLimit = limit > 0;
        var shareOfTotal = total > 0 ? Math.min(100, round2((spent / total) * 100)) : 0;
        var limitPercent = hasLimit ? Math.min(100, round2((spent / limit) * 100)) : 0;
        return {
          category: cat,
          icon: categoryIcon(cat),
          color: categoryColor(cat),
          spent: spent,
          shareOfTotal: shareOfTotal,
          limit: limit,
          hasLimit: hasLimit,
          over: hasLimit && spent > limit + EPS,
          limitPercent: limitPercent
        };
      })
      .sort(function (a, b) { return b.spent - a.spent; });
  }



  function render() {
    renderBudgetList();
    renderBudgetDetail();
  }

  function renderBudgetList() {
    var query = dom.budgetSearch.value.trim().toLowerCase();
    var budgets = state.budgets.filter(function (b) {
      return !query || b.name.toLowerCase().indexOf(query) !== -1;
    });

    dom.sidebarLoadSampleHint.hidden = state.budgets.length !== 0;
    dom.budgetList.innerHTML = '';

    budgets.forEach(function (budget) {
      var li = document.createElement('li');
      li.className = 'budget-list-item' + (budget.id === state.selectedBudgetId ? ' active' : '');
      li.innerHTML =
        '<span class="budget-list-item-name">' + escapeHtml(budget.name) + '</span>' +
        '<span class="budget-list-item-meta">' +
        budget.members.length + ' member' + (budget.members.length === 1 ? '' : 's') + ' &middot; ' +
        formatCurrency(budgetTotal(budget)) +
        '</span>';
      li.addEventListener('click', function () {
        state.selectedBudgetId = budget.id;
        saveState();
        render();
      });
      dom.budgetList.appendChild(li);
    });
  }

  function renderBudgetDetail() {
    var budget = getSelectedBudget();
    if (!budget) {
      dom.emptyState.hidden = false;
      dom.budgetDetailContent.hidden = true;
      dom.sectionNav.hidden = true;
      return;
    }
    dom.emptyState.hidden = true;
    dom.budgetDetailContent.hidden = false;
    dom.sectionNav.hidden = false;

    renderBudgetHeader(budget);
    renderCharts(budget);
    renderCategoryBreakdown(budget);
    renderMembers(budget);
    renderExpenseFilterOptions(budget);
    renderExpenses();
  }

  function renderBudgetHeader(budget) {
    dom.budgetHeader.innerHTML =
      '<div class="budget-header-top">' +
      '<div>' +
      '<h2 class="budget-header-title">' + escapeHtml(budget.name) + '</h2>' +
      '<div class="budget-header-meta">Created ' + formatDate(budget.createdAt) + '</div>' +
      (budget.description ? '<div class="budget-header-desc">' + escapeHtml(budget.description) + '</div>' : '') +
      '</div>' +
      '<div class="budget-header-actions">' +
      '<button class="btn btn-ghost" id="btnEditBudget">Edit Budget</button>' +
      '<button class="btn btn-secondary" id="btnAddMember">Add Members</button>' +
      '<button class="btn btn-primary" id="btnAddExpense">Add Expense</button>' +
      '</div>' +
      '</div>';

    document.getElementById('btnEditBudget').addEventListener('click', function () { openEditBudgetModal(budget); });
    document.getElementById('btnAddMember').addEventListener('click', function () { openAddMemberModal(budget); });
    document.getElementById('btnAddExpense').addEventListener('click', function () { openAddExpenseModal(budget); });
  }

  function statCard(icon, label, value, sub) {
    return '<div class="stat-card">' +
      '<div class="stat-icon">' + ICONS[icon] + '</div>' +
      '<div class="stat-body">' +
      '<span class="stat-label">' + escapeHtml(label) + '</span>' +
      '<span class="stat-value" title="' + escapeHtml(value) + '">' + escapeHtml(value) + '</span>' +
      (sub ? '<span class="stat-sub">' + escapeHtml(sub) + '</span>' : '') +
      '</div>' +
      '</div>';
  }

  function renderCharts(budget) {
    var breakdown = computeCategoryBreakdown(budget);
    var topCategory = (breakdown[0] && breakdown[0].spent > 0) ? breakdown[0] : null;
    var avgPerDay = computeAvgPerDay(budget);

    dom.budgetStats.innerHTML =
      statCard('wallet', 'Total Spent', formatCurrency(budgetTotal(budget))) +
      statCard('users', 'Members', String(budget.members.length)) +
      statCard('list', 'Expenses', String(budget.expenses.length)) +
      statCard('trendingUp', 'Avg / Day', budget.expenses.length > 0 ? formatCurrency(avgPerDay) : '—') +
      statCard('award', 'Top Category', topCategory ? topCategory.category : '—');
  }

  function renderMembers(budget) {
    var totals = computeMemberTotals(budget);
    var total = budgetTotal(budget);
    dom.membersList.innerHTML = '';
    dom.membersEmpty.hidden = budget.members.length > 0;

    budget.members.forEach(function (m) {
      var spent = totals[m.id] || 0;
      var percent = total > 0 ? Math.min(100, round2((spent / total) * 100)) : 0;
      var progressTooltip = formatCurrency(spent) + ' — ' + percent + '% of total spend';
      var card = document.createElement('div');
      card.className = 'member-card';
      card.innerHTML =
        '<div class="member-card-top">' +
        '<div>' +
        '<div class="member-name">' + escapeHtml(m.name) + '</div>' +
        (m.role ? '<div class="member-role">' + escapeHtml(m.role) + '</div>' : '') +
        '</div>' +
        '<div class="member-actions">' +
        '<button class="btn btn-ghost btn-sm btn-icon" data-action="edit" title="Edit member" aria-label="Edit ' + escapeHtml(m.name) + '">' + ICONS.edit + '</button>' +
        '<button class="btn btn-danger btn-sm btn-icon" data-action="remove" title="Remove member" aria-label="Remove ' + escapeHtml(m.name) + '">' + ICONS.trash + '</button>' +
        '</div>' +
        '</div>' +
        '<div class="member-bottom">' +
        '<div class="member-figures">' +
        '<span>Spent: ' + formatCurrency(spent) + '</span>' +
        '<span>' + percent + '% of total</span>' +
        '</div>' +
        '<div class="member-progress" data-tooltip="' + escapeHtml(progressTooltip) + '">' +
        '<div class="member-progress-bar" style="width:' + percent + '%;"></div>' +
        '</div>' +
        '</div>';

      card.querySelector('[data-action="edit"]').addEventListener('click', function () {
        openEditMemberModal(budget, m);
      });
      card.querySelector('[data-action="remove"]').addEventListener('click', function () {
        handleRemoveMember(budget, m);
      });
      dom.membersList.appendChild(card);
    });
  }

  function renderExpenseFilterOptions(budget) {
    filters.category = CATEGORIES.indexOf(filters.category) !== -1 ? filters.category : '';
    filters.member = findMember(budget, filters.member) ? filters.member : '';

    renderDropdown(dom.filterCategory, {
      items: [{ value: '', label: 'All Categories' }].concat(
        CATEGORIES.map(function (c) { return { value: c, label: c, icon: categoryIcon(c) }; })
      ),
      value: filters.category,
      ariaLabel: 'Filter by category',
      onChange: function (value) {
        filters.category = value;
        renderExpenses();
      }
    });

    renderDropdown(dom.filterMember, {
      items: [{ value: '', label: 'All Members' }].concat(
        budget.members.map(function (m) { return { value: m.id, label: m.name }; })
      ),
      value: filters.member,
      ariaLabel: 'Filter by member',
      onChange: function (value) {
        filters.member = value;
        renderExpenses();
      }
    });

    renderDropdown(dom.sortExpenses, {
      items: SORT_OPTIONS,
      value: filters.sort,
      ariaLabel: 'Sort expenses',
      onChange: function (value) {
        filters.sort = value;
        renderExpenses();
      }
    });
  }

  function renderExpenses() {
    var budget = getSelectedBudget();
    if (!budget) return;

    var list = budget.expenses.slice();

    if (filters.category) {
      list = list.filter(function (e) { return e.category === filters.category; });
    }
    if (filters.member) {
      list = list.filter(function (e) { return e.paidBy === filters.member; });
    }

    list.sort(function (a, b) {
      switch (filters.sort) {
        case 'date-asc': return a.date.localeCompare(b.date);
        case 'amount-desc': return b.amount - a.amount;
        case 'amount-asc': return a.amount - b.amount;
        case 'date-desc':
        default: return b.date.localeCompare(a.date);
      }
    });

    dom.expensesBody.innerHTML = '';
    dom.expensesEmpty.hidden = list.length > 0;

    list.forEach(function (exp) {
      var payer = findMember(budget, exp.paidBy);
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><span class="category-badge">' + escapeHtml(exp.category) + '</span></td>' +
        '<td>' + escapeHtml(exp.description) + '</td>' +
        '<td>' + formatCurrency(exp.amount) + '</td>' +
        '<td>' + escapeHtml(payer ? payer.name : 'Unknown') + '</td>' +
        '<td>' + escapeHtml(exp.paymentMethod || '—') + '</td>' +
        '<td>' + formatDate(exp.date) + '</td>' +
        '<td class="col-actions"><div class="row-actions">' +
        '<button class="btn btn-ghost btn-sm btn-icon" data-action="edit" title="Edit expense" aria-label="Edit expense">' + ICONS.edit + '</button>' +
        '<button class="btn btn-danger btn-sm btn-icon" data-action="delete" title="Delete expense" aria-label="Delete expense">' + ICONS.trash + '</button>' +
        '</div></td>';

      tr.querySelector('[data-action="edit"]').addEventListener('click', function () {
        openEditExpenseModal(budget, exp);
      });
      tr.querySelector('[data-action="delete"]').addEventListener('click', function () {
        handleDeleteExpense(budget, exp);
      });
      dom.expensesBody.appendChild(tr);
    });
  }




  function renderCategoryBreakdown(budget) {
    var rows = computeCategoryBreakdown(budget);

    if (rows.length === 0) {
      dom.categoryComposition.hidden = true;
      dom.limitCards.innerHTML = '<p class="empty-hint">No expenses yet, and no budget limits set. Use "Manage Limits" to set a monthly limit per category.</p>';
      dom.limitAlerts.innerHTML = '';
      return;
    }

    dom.categoryComposition.hidden = false;
    dom.categoryComposition.innerHTML = rows.map(function (row) {
      var tooltip = row.category + ' – ' + formatCurrency(row.spent) + ' (' + row.shareOfTotal + '%)';
      return '<div class="composition-segment" style="width:' + row.shareOfTotal + '%; background:' + row.color + ';" data-tooltip="' +
        escapeHtml(tooltip) + '"></div>';
    }).join('');

    dom.limitCards.innerHTML = rows.map(function (row) {
      var overClass = row.over ? ' over' : '';
      var figuresHtml = row.hasLimit
        ? '<span class="spent' + overClass + '">' + formatCurrency(row.spent) + '</span><span>of ' + formatCurrency(row.limit) + '</span>'
        : '<span class="spent">' + formatCurrency(row.spent) + '</span><span class="limit-card-nolimit">no limit set</span>';
      var barPercent = row.hasLimit ? row.limitPercent : row.shareOfTotal;
      var barStyle = 'width:' + barPercent + '%;' + (row.hasLimit ? '' : ' background:' + row.color + ';');
      var barTooltip = row.hasLimit
        ? (row.over
          ? formatCurrency(row.spent) + ' of ' + formatCurrency(row.limit) + ' — ' + formatCurrency(row.spent - row.limit) + ' over budget'
          : formatCurrency(row.spent) + ' of ' + formatCurrency(row.limit) + ' (' + row.limitPercent + '%) — ' + formatCurrency(row.limit - row.spent) + ' left')
        : formatCurrency(row.spent) + ' — ' + row.shareOfTotal + '% of total spend';


      var cardStyle = 'background: color-mix(in srgb, ' + row.color + ' 12%, var(--color-panel) 88%); ' +
        'border-color: color-mix(in srgb, ' + row.color + ' 35%, var(--color-border) 65%);';
      return '<div class="limit-card" style="' + cardStyle + '">' +
        '<div class="limit-card-head">' + row.icon + '<span class="limit-card-name">' + escapeHtml(row.category) + '</span>' +
        '<span class="limit-card-share">' + row.shareOfTotal + '% of spend</span></div>' +
        '<div class="limit-card-figures">' + figuresHtml + '</div>' +
        '<div class="limit-card-track" data-tooltip="' + escapeHtml(barTooltip) + '"><div class="limit-card-fill' + overClass + '" style="' + barStyle + '"></div></div>' +
        '</div>';
    }).join('');

    var overRows = rows.filter(function (r) { return r.over; });
    if (overRows.length === 0) {
      dom.limitAlerts.innerHTML = '<p class="empty-hint">Everything is within budget.</p>';
    } else {
      dom.limitAlerts.innerHTML = overRows.map(function (r) {
        return '<div class="limit-alert">' + ICONS.alertTriangle + '<span><strong>' + escapeHtml(r.category) +
          '</strong> is over budget by ' + formatCurrency(r.spent - r.limit) + '</span></div>';
      }).join('');
    }
  }



  var modalApi = Buddy.modal.init();
  var openModal = modalApi.open;
  var closeModal = modalApi.close;

  function openConfirmModal(title, message, confirmLabel, onConfirm, opts) {
    opts = opts || {};
    var danger = opts.danger ? 'btn-danger' : 'btn-primary';
    var html =
      '<p class="modal-message">' + escapeHtml(message) + '</p>' +
      '<div class="modal-actions">' +
      '<button class="btn btn-ghost" id="btnConfirmNo">' + escapeHtml(opts.cancelLabel || 'Cancel') + '</button>' +
      '<button class="btn ' + danger + '" id="btnConfirmYes">' + escapeHtml(confirmLabel) + '</button>' +
      '</div>';
    openModal(title, html, function (body) {
      body.querySelector('#btnConfirmNo').addEventListener('click', closeModal);
      body.querySelector('#btnConfirmYes').addEventListener('click', function () {
        closeModal();
        onConfirm();
      });
    });
  }



  function renderDropdown(container, config) {
    var items = config.items || [];
    var selectedItem = items.find(function (i) { return i.value === config.value; });

    var selectedHtml = selectedItem
      ? (selectedItem.icon || '') + '<span>' + escapeHtml(selectedItem.label) + '</span>'
      : '<span class="dropdown-placeholder">' + escapeHtml(config.placeholder || 'Select') + '</span>';

    var optionsHtml = items.map(function (item) {
      var activeClass = item.value === config.value ? ' active' : '';
      return '<button type="button" class="dropdown-option' + activeClass + '" data-value="' + escapeHtml(item.value) + '">' +
        (item.icon || '') + '<span>' + escapeHtml(item.label) + '</span></button>';
    }).join('');

    container.innerHTML =
      '<div class="dropdown">' +
      '<button type="button" class="form-control dropdown-toggle" aria-haspopup="listbox" aria-expanded="false"' +
      (config.ariaLabel ? ' aria-label="' + escapeHtml(config.ariaLabel) + '"' : '') + '>' +
      '<span class="dropdown-selected">' + selectedHtml + '</span>' +
      ICONS.chevronDown +
      '</button>' +
      '<div class="dropdown-menu" role="listbox" hidden>' + optionsHtml + '</div>' +
      '</div>';

    var dropdown = container.querySelector('.dropdown');
    var toggle = dropdown.querySelector('.dropdown-toggle');
    var menu = dropdown.querySelector('.dropdown-menu');
    var selectedDisplay = dropdown.querySelector('.dropdown-selected');

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = dropdown.classList.contains('open');
      if (isOpen) {
        dropdown.classList.remove('open');
        menu.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
      } else {
        dropdown.classList.add('open');
        menu.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
      }
    });

    menu.querySelectorAll('.dropdown-option').forEach(function (option) {
      option.addEventListener('click', function () {
        var value = option.getAttribute('data-value');
        var item = items.find(function (i) { return i.value === value; });
        config.value = value;
        selectedDisplay.innerHTML = item ? (item.icon || '') + '<span>' + escapeHtml(item.label) + '</span>' : '';
        menu.querySelectorAll('.dropdown-option').forEach(function (o) {
          o.classList.toggle('active', o === option);
        });
        dropdown.classList.remove('open');
        menu.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        if (typeof config.onChange === 'function') config.onChange(value);
      });
    });
  }



  function openAddBudgetModal() {
    renderBudgetFormModal('Add Budget', null);
  }

  function openEditBudgetModal(budget) {
    renderBudgetFormModal('Edit Budget', budget);
  }

  function renderBudgetFormModal(title, budget) {
    var html =
      '<form id="budgetForm">' +
      '<div class="form-group">' +
      '<label for="budgetName">Budget Name</label>' +
      '<input type="text" id="budgetName" class="form-control" value="' + (budget ? escapeHtml(budget.name) : '') + '" required>' +
      '<div class="form-error" id="budgetNameError">Budget name cannot be empty.</div>' +
      '</div>' +
      '<div class="form-group">' +
      '<label for="budgetDescription">Description (optional)</label>' +
      '<textarea id="budgetDescription" class="form-control">' + (budget ? escapeHtml(budget.description || '') : '') + '</textarea>' +
      '</div>' +
      (budget ? '<div class="modal-actions-split">' +
        '<button type="button" class="btn btn-danger" id="btnDeleteBudget">Delete Budget</button>' +
        '<div class="modal-actions" style="margin-top:0;">' +
        '<button type="button" class="btn btn-ghost" id="btnCancelBudget">Cancel</button>' +
        '<button type="submit" class="btn btn-primary">Save Changes</button>' +
        '</div></div>'
        :
        '<div class="modal-actions">' +
        '<button type="button" class="btn btn-ghost" id="btnCancelBudget">Cancel</button>' +
        '<button type="submit" class="btn btn-primary">Add Budget</button>' +
        '</div>') +
      '</form>';

    openModal(title, html, function (body) {
      body.querySelector('#btnCancelBudget').addEventListener('click', closeModal);
      if (budget) {
        body.querySelector('#btnDeleteBudget').addEventListener('click', function () {
          closeModal();
          openConfirmModal(
            'Delete Budget',
            'Delete "' + budget.name + '" and all of its members and expenses? This cannot be undone.',
            'Delete Budget',
            function () {
              state.budgets = state.budgets.filter(function (b) { return b.id !== budget.id; });
              if (state.selectedBudgetId === budget.id) state.selectedBudgetId = null;
              saveState();
              render();
            },
            { danger: true }
          );
        });
      }
      body.querySelector('#budgetForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var nameInput = body.querySelector('#budgetName');
        var name = nameInput.value.trim();
        var nameError = body.querySelector('#budgetNameError');
        if (!name) {
          nameError.classList.add('visible');
          return;
        }
        nameError.classList.remove('visible');

        var description = body.querySelector('#budgetDescription').value.trim();

        if (budget) {
          budget.name = name;
          budget.description = description;
        } else {
          var newBudget = {
            id: uid(),
            name: name,
            description: description,
            createdAt: new Date().toISOString().slice(0, 10),
            members: [],
            expenses: [],
            categoryLimits: {}
          };
          state.budgets.push(newBudget);
          state.selectedBudgetId = newBudget.id;
        }
        saveState();
        closeModal();
        render();
      });
    });
  }



  function memberRowHtml() {
    return '<div class="member-row">' +
      '<input type="text" class="form-control member-row-name" placeholder="Member name">' +
      '<input type="text" class="form-control member-row-role" placeholder="Relation (optional)">' +
      '<button type="button" class="btn btn-ghost member-row-remove" aria-label="Remove row">' + ICONS.x + '</button>' +
      '</div>';
  }

  function openAddMemberModal(budget) {
    var rowsHtml = memberRowHtml();
    var html =
      '<form id="membersForm">' +
      '<div id="memberRows">' + rowsHtml + '</div>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="btnAddMemberRow">' + ICONS.plus + 'Add another member</button>' +
      '<div class="form-error" id="membersError">Enter at least one member name.</div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn-ghost" id="btnCancelMembers">Cancel</button>' +
      '<button type="submit" class="btn btn-primary">Add Member(s)</button>' +
      '</div>' +
      '</form>';

    openModal('Add Members', html, function (body) {
      var rowsContainer = body.querySelector('#memberRows');

      function attachRowRemove(row) {
        row.querySelector('.member-row-remove').addEventListener('click', function () {
          if (rowsContainer.querySelectorAll('.member-row').length > 1) {
            row.remove();
          } else {
            row.querySelector('.member-row-name').value = '';
            row.querySelector('.member-row-role').value = '';
          }
        });
      }

      rowsContainer.querySelectorAll('.member-row').forEach(attachRowRemove);

      body.querySelector('#btnAddMemberRow').addEventListener('click', function () {
        var wrapper = document.createElement('div');
        wrapper.innerHTML = memberRowHtml();
        var row = wrapper.firstElementChild;
        rowsContainer.appendChild(row);
        attachRowRemove(row);
        row.querySelector('.member-row-name').focus();
      });

      body.querySelector('#btnCancelMembers').addEventListener('click', closeModal);

      body.querySelector('#membersForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var newMembers = [];
        rowsContainer.querySelectorAll('.member-row').forEach(function (row) {
          var name = row.querySelector('.member-row-name').value.trim();
          var role = row.querySelector('.member-row-role').value.trim();
          if (name) newMembers.push({ id: uid(), name: name, role: role });
        });

        var errorEl = body.querySelector('#membersError');
        if (newMembers.length === 0) {
          errorEl.classList.add('visible');
          return;
        }
        errorEl.classList.remove('visible');

        budget.members = budget.members.concat(newMembers);
        saveState();
        closeModal();
        renderBudgetDetail();
        renderBudgetList();
      });
    });
  }

  function openEditMemberModal(budget, member) {
    var html =
      '<form id="memberForm">' +
      '<div class="form-group">' +
      '<label for="memberName">Name</label>' +
      '<input type="text" id="memberName" class="form-control" value="' + escapeHtml(member.name) + '" required>' +
      '<div class="form-error" id="memberNameError">Member name cannot be empty.</div>' +
      '</div>' +
      '<div class="form-group">' +
      '<label for="memberRole">Relation (optional)</label>' +
      '<input type="text" id="memberRole" class="form-control" value="' + escapeHtml(member.role || '') + '">' +
      '</div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn-ghost" id="btnCancelMember">Cancel</button>' +
      '<button type="submit" class="btn btn-primary">Save Changes</button>' +
      '</div>' +
      '</form>';

    openModal('Edit Member', html, function (body) {
      body.querySelector('#btnCancelMember').addEventListener('click', closeModal);
      body.querySelector('#memberForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var nameInput = body.querySelector('#memberName');
        var name = nameInput.value.trim();
        var nameError = body.querySelector('#memberNameError');
        if (!name) {
          nameError.classList.add('visible');
          return;
        }
        nameError.classList.remove('visible');
        member.name = name;
        member.role = body.querySelector('#memberRole').value.trim();
        saveState();
        closeModal();
        renderBudgetDetail();
        renderBudgetList();
      });
    });
  }

  function handleRemoveMember(budget, member) {
    var involvedExpenses = budget.expenses.filter(function (exp) { return exp.paidBy === member.id; });

    if (involvedExpenses.length) {
      openConfirmModal(
        'Cannot Remove Member',
        '"' + member.name + '" is tied to ' + involvedExpenses.length + ' expense(s) they paid for. Reassign or delete those expenses first.',
        'OK',
        function () {}
      );
      return;
    }

    openConfirmModal(
      'Remove Member',
      'Remove "' + member.name + '" from this budget?',
      'Remove',
      function () {
        budget.members = budget.members.filter(function (m) { return m.id !== member.id; });
        saveState();
        renderBudgetDetail();
        renderBudgetList();
      },
      { danger: true }
    );
  }



  function openAddExpenseModal(budget) {
    if (budget.members.length === 0) {
      openConfirmModal(
        'No Members',
        'This budget has no members yet. Add at least one member before recording an expense.',
        'Add Members',
        function () { openAddMemberModal(budget); }
      );
      return;
    }
    renderExpenseFormModal(budget, null);
  }

  function openEditExpenseModal(budget, expense) {
    renderExpenseFormModal(budget, expense);
  }

  function renderExpenseFormModal(budget, expense) {
    var title = expense ? 'Edit Expense' : 'Add Expense';
    var selectedCategory = expense ? expense.category : '';
    var selectedPayment = expense ? expense.paymentMethod : '';

    var html =
      '<form id="expenseForm">' +
      '<div class="form-row">' +
      '<div class="form-group">' +
      '<label>Category</label>' +
      '<div id="categoryDropdownContainer"></div>' +
      '<div class="form-error" id="expCategoryError">Please select a category.</div>' +
      '</div>' +
      '<div class="form-group">' +
      '<label for="expDate">Date</label>' +
      '<input type="date" id="expDate" class="form-control" value="' + (expense ? expense.date : new Date().toISOString().slice(0, 10)) + '" required>' +
      '</div>' +
      '</div>' +
      '<div class="form-group">' +
      '<label for="expDescription">Description</label>' +
      '<input type="text" id="expDescription" class="form-control" value="' + (expense ? escapeHtml(expense.description) : '') + '">' +
      '</div>' +
      '<div class="form-row">' +
      '<div class="form-group">' +
      '<label for="expAmount">Amount</label>' +
      '<input type="number" id="expAmount" class="form-control" step="0.01" min="0.01" value="' + (expense ? expense.amount : '') + '" required>' +
      '<div class="form-error" id="expAmountError">Amount must be a positive number.</div>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Paid By</label>' +
      '<div id="expPaidByContainer"></div>' +
      '</div>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Payment Method</label>' +
      '<div class="payment-method-pills" id="expPaymentPills" role="group" aria-label="Payment method">' +
      PAYMENT_METHODS.map(function (pm) { return '<button type="button" class="payment-method-pill" data-payment="' + escapeHtml(pm) + '">' + escapeHtml(pm) + '</button>'; }).join('') +
      '</div>' +
      '</div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn-ghost" id="btnCancelExpense">Cancel</button>' +
      '<button type="submit" class="btn btn-primary">' + (expense ? 'Save Changes' : 'Add Expense') + '</button>' +
      '</div>' +
      '</form>';

    openModal(title, html, function (body) {
      var amountInput = body.querySelector('#expAmount');

      var categoryValue = selectedCategory;
      renderDropdown(body.querySelector('#categoryDropdownContainer'), {
        items: CATEGORIES.map(function (c) { return { value: c, label: c, icon: categoryIcon(c) }; }),
        value: categoryValue,
        placeholder: 'Select category',
        ariaLabel: 'Category',
        onChange: function (value) {
          categoryValue = value;
          body.querySelector('#expCategoryError').classList.remove('visible');
        }
      });

      var paidByValue = expense ? expense.paidBy : (budget.members[0] ? budget.members[0].id : '');
      renderDropdown(body.querySelector('#expPaidByContainer'), {
        items: budget.members.map(function (m) { return { value: m.id, label: m.name }; }),
        value: paidByValue,
        placeholder: 'Select member',
        ariaLabel: 'Paid by',
        onChange: function (value) { paidByValue = value; }
      });

      var paymentValue = selectedPayment || PAYMENT_METHODS[0];
      var paymentPills = body.querySelectorAll('.payment-method-pill');
      function updatePaymentPills() {
        paymentPills.forEach(function (pill) {
          pill.classList.toggle('selected', pill.getAttribute('data-payment') === paymentValue);
        });
      }
      paymentPills.forEach(function (pill) {
        pill.addEventListener('click', function () {
          paymentValue = pill.getAttribute('data-payment');
          updatePaymentPills();
        });
      });
      updatePaymentPills();

      body.querySelector('#btnCancelExpense').addEventListener('click', closeModal);
      body.querySelector('#expenseForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var valid = true;

        var category = categoryValue;
        var categoryError = body.querySelector('#expCategoryError');
        if (!category) {
          categoryError.classList.add('visible');
          valid = false;
        } else {
          categoryError.classList.remove('visible');
        }

        var amount = parseFloat(amountInput.value);
        var amountError = body.querySelector('#expAmountError');
        if (!(amount > 0)) {
          amountError.classList.add('visible');
          valid = false;
        } else {
          amountError.classList.remove('visible');
        }

        if (!valid) return;

        var description = body.querySelector('#expDescription').value.trim();
        var date = body.querySelector('#expDate').value;
        var paidBy = paidByValue;
        var paymentMethod = paymentValue;

        if (expense) {
          expense.category = category;
          expense.description = description;
          expense.amount = round2(amount);
          expense.date = date;
          expense.paidBy = paidBy;
          expense.paymentMethod = paymentMethod;
        } else {
          budget.expenses.push({
            id: uid(),
            category: category,
            description: description,
            amount: round2(amount),
            date: date,
            paidBy: paidBy,
            paymentMethod: paymentMethod
          });
        }

        saveState();
        closeModal();
        renderBudgetDetail();
        renderBudgetList();
      });
    });
  }

  function handleDeleteExpense(budget, expense) {
    openConfirmModal(
      'Delete Expense',
      'Delete this expense (' + expense.description + ', ' + formatCurrency(expense.amount) + ')?',
      'Delete',
      function () {
        budget.expenses = budget.expenses.filter(function (e) { return e.id !== expense.id; });
        saveState();
        renderBudgetDetail();
        renderBudgetList();
      },
      { danger: true }
    );
  }



  function openManageLimitsModal(budget) {
    var limits = budget.categoryLimits || {};
    var rowsHtml = CATEGORIES.map(function (cat) {
      var val = limits[cat] ? limits[cat] : '';
      return '<div class="limit-input-row">' +
        '<span class="limit-input-label">' + categoryIcon(cat) + '<span>' + escapeHtml(cat) + '</span></span>' +
        '<input type="number" class="form-control limit-input" step="0.01" min="0" data-category="' + escapeHtml(cat) + '" value="' + val + '" placeholder="No limit">' +
        '</div>';
    }).join('');

    var html =
      '<form id="limitsForm">' +
      '<p class="form-hint">Set an optional monthly spending limit for each category. Leave a field blank for no limit.</p>' +
      rowsHtml +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn-ghost" id="btnCancelLimits">Cancel</button>' +
      '<button type="submit" class="btn btn-primary">Save Limits</button>' +
      '</div>' +
      '</form>';

    openModal('Manage Category Limits', html, function (body) {
      body.querySelector('#btnCancelLimits').addEventListener('click', closeModal);
      body.querySelector('#limitsForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var newLimits = {};
        body.querySelectorAll('.limit-input').forEach(function (input) {
          var val = parseFloat(input.value);
          if (val > 0) newLimits[input.getAttribute('data-category')] = round2(val);
        });
        budget.categoryLimits = newLimits;
        saveState();
        closeModal();
        renderBudgetDetail();
      });
    });
  }



  function openExportDataModal() {
    if (state.budgets.length === 0) {
      openConfirmModal('Export Data', 'There are no budgets to export yet.', 'OK', function () {});
      return;
    }

    var rowsHtml = state.budgets.map(function (b) {
      return '<label class="export-budget-row selected">' +
        '<input type="checkbox" class="export-budget-checkbox" data-budget="' + b.id + '" checked>' +
        '<span class="export-budget-row-name">' + escapeHtml(b.name) + '</span>' +
        '<span class="export-budget-row-meta">' + formatCurrency(budgetTotal(b)) + '</span>' +
        '</label>';
    }).join('');

    var html =
      '<form id="exportDataForm">' +
      '<div class="form-group">' +
      '<label>Budgets to include</label>' +
      '<div class="export-budget-list">' + rowsHtml + '</div>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="btnToggleAllExportBudgets" style="margin-top:8px;">Select / Deselect All</button>' +
      '<div class="form-error" id="exportDataError">Select at least one budget to export.</div>' +
      '</div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn-ghost" id="btnCancelExportData">Cancel</button>' +
      '<button type="submit" class="btn btn-primary">Export</button>' +
      '</div>' +
      '</form>';

    openModal('Export Data', html, function (body) {
      var checkboxes = body.querySelectorAll('.export-budget-checkbox');

      checkboxes.forEach(function (cb) {
        cb.addEventListener('change', function () {
          cb.closest('.export-budget-row').classList.toggle('selected', cb.checked);
        });
      });

      body.querySelector('#btnToggleAllExportBudgets').addEventListener('click', function () {
        var allChecked = Array.prototype.every.call(checkboxes, function (cb) { return cb.checked; });
        checkboxes.forEach(function (cb) {
          cb.checked = !allChecked;
          cb.closest('.export-budget-row').classList.toggle('selected', cb.checked);
        });
      });

      body.querySelector('#btnCancelExportData').addEventListener('click', closeModal);

      body.querySelector('#exportDataForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var selectedIds = Array.prototype.filter.call(checkboxes, function (cb) { return cb.checked; })
          .map(function (cb) { return cb.getAttribute('data-budget'); });

        var errorEl = body.querySelector('#exportDataError');
        if (selectedIds.length === 0) {
          errorEl.classList.add('visible');
          return;
        }
        errorEl.classList.remove('visible');

        var selectedBudgets = state.budgets.filter(function (b) { return selectedIds.indexOf(b.id) !== -1; });
        closeModal();
        exportDataJSON(selectedBudgets);
      });
    });
  }

  function exportDataJSON(budgets) {
    var content = JSON.stringify({ budgets: budgets, selectedBudgetId: null }, null, 2);
    downloadFile('personal-expense-buddy-backup-' + new Date().toISOString().slice(0, 10) + '.json', content, 'application/json');
  }

  function handleImportFile(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var parsed;
      try {
        parsed = JSON.parse(reader.result);
      } catch (err) {
        openConfirmModal('Import Failed', 'That file is not valid JSON.', 'OK', function () {});
        dom.fileImportData.value = '';
        return;
      }
      if (!parsed || !Array.isArray(parsed.budgets)) {
        openConfirmModal('Import Failed', 'That file does not look like a Personal Expense Buddy backup.', 'OK', function () {});
        dom.fileImportData.value = '';
        return;
      }

      if (state.budgets.length === 0) {
        state = { budgets: parsed.budgets, selectedBudgetId: null };
        saveState();
        render();
      } else {
        openImportChoiceModal(parsed.budgets);
      }
      dom.fileImportData.value = '';
    };
    reader.readAsText(file);
  }

  function handleLoadSample(e) {
    e.preventDefault();
    if (window.location.protocol === 'file:') {
      openConfirmModal(
        'Server Required',
        'Loading the sample budgets needs the app to be served from a local or remote server — it can’t read local files when index.html is opened directly from your file system. Instead, download personalExpenseBuddy_sample.json from cdnBuddy/samples and use the Import button (top-left) to load it.',
        'OK', function () {});
      return;
    }
    fetch('https://isafuianish-dev.github.io/webapp_cdnBuddy/samples/personalExpenseBuddy_sample.json')
      .then(function (res) {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then(function (parsed) {
        if (!parsed || !Array.isArray(parsed.budgets) || !parsed.budgets.length) throw new Error('Invalid data');
        var newBudgets = parsed.budgets.map(remapImportedBudgetIds);
        state.budgets = state.budgets.concat(newBudgets);
        state.selectedBudgetId = newBudgets[0].id;
        saveState();
        render();
      })
      .catch(function () {
        openConfirmModal('Load Failed', 'Could not load the sample budgets.', 'OK', function () {});
      });
  }

  function openImportChoiceModal(importedBudgets) {
    var html =
      '<p class="modal-message">This browser already has ' + state.budgets.length + ' budget(s) saved. The file you picked has ' +
      importedBudgets.length + ' budget(s). What would you like to do?</p>' +
      '<div class="modal-actions">' +
      '<button class="btn btn-ghost" id="btnImportCancel">Cancel</button>' +
      '<button class="btn btn-danger" id="btnImportReplace">Replace All</button>' +
      '<button class="btn btn-primary" id="btnImportAppend">Append</button>' +
      '</div>';

    openModal('Import Data', html, function (body) {
      body.querySelector('#btnImportCancel').addEventListener('click', closeModal);

      body.querySelector('#btnImportReplace').addEventListener('click', function () {
        closeModal();
        state = { budgets: importedBudgets, selectedBudgetId: null };
        saveState();
        render();
      });

      body.querySelector('#btnImportAppend').addEventListener('click', function () {
        closeModal();
        state.budgets = state.budgets.concat(importedBudgets.map(remapImportedBudgetIds));
        saveState();
        render();
      });
    });
  }




  function remapImportedBudgetIds(budget) {
    var idMap = {};
    var newMembers = (budget.members || []).map(function (m) {
      var newId = uid();
      idMap[m.id] = newId;
      return { id: newId, name: m.name, role: m.role };
    });

    var newExpenses = (budget.expenses || []).map(function (exp) {
      return {
        id: uid(),
        category: exp.category,
        description: exp.description,
        amount: exp.amount,
        date: exp.date,
        paidBy: idMap.hasOwnProperty(exp.paidBy) ? idMap[exp.paidBy] : exp.paidBy,
        paymentMethod: exp.paymentMethod
      };
    });

    return {
      id: uid(),
      name: budget.name,
      description: budget.description,
      createdAt: budget.createdAt || new Date().toISOString().slice(0, 10),
      members: newMembers,
      expenses: newExpenses,
      categoryLimits: budget.categoryLimits || {}
    };
  }

  function exportSummaryCsv(budget) {
    if (!budget) return;
    var totals = computeMemberTotals(budget);
    var rows = [
      ['Budget Summary'],
      ['Name', budget.name],
      ['Description', budget.description || ''],
      ['Created', budget.createdAt || ''],
      ['Total Spent', budgetTotal(budget)],
      ['Members', budget.members.length],
      [],
      ['Member', 'Relation', 'Total Spent']
    ];
    budget.members.forEach(function (m) {
      rows.push([m.name, m.role || '', totals[m.id] || 0]);
    });
    downloadFile(safeFileName(budget.name) + '-summary.csv', toCsv(rows), 'text/csv');
  }

  function exportExpensesCsv(budget) {
    if (!budget) return;
    var rows = [['Category', 'Description', 'Amount', 'Paid By', 'Payment Method', 'Date']];
    budget.expenses.forEach(function (exp) {
      var payer = findMember(budget, exp.paidBy);
      rows.push([exp.category, exp.description, exp.amount, payer ? payer.name : '', exp.paymentMethod || '', exp.date]);
    });
    downloadFile(safeFileName(budget.name) + '-expenses.csv', toCsv(rows), 'text/csv');
  }

  function exportLimitsCsv(budget) {
    if (!budget) return;
    var rows = computeCategoryBreakdown(budget);
    var csvRows = [['Category', 'Spent', '% of Total', 'Limit', 'Remaining / Over']];
    rows.forEach(function (r) {
      csvRows.push([r.category, r.spent, r.shareOfTotal, r.hasLimit ? r.limit : '', r.hasLimit ? round2(r.limit - r.spent) : '']);
    });
    downloadFile(safeFileName(budget.name) + '-budget-vs-actual.csv', toCsv(csvRows), 'text/csv');
  }

  function safeFileName(name) {
    return (name || 'budget').replace(/[^a-z0-9\-_]+/gi, '_').toLowerCase();
  }

  function exportPdf(budget) {
    if (!budget) return;
    var total = budgetTotal(budget);
    var rows = computeCategoryBreakdown(budget);

    var html = '<div class="print-title">' + escapeHtml(budget.name) + '</div>' +
      '<div class="print-meta">Created ' + formatDate(budget.createdAt) +
      ' &bull; Total Spent: ' + formatCurrency(total) +
      ' &bull; ' + budget.members.length + ' member(s)</div>' +
      '<div class="print-credit">Generated from Personal Expense Buddy &mdash; Made with ' + ICONS.heart + ' by Anish</div>';



    html += '<div class="print-section-title">Spending by Category</div>';
    if (rows.length === 0) {
      html += '<p class="print-chart-empty">No expenses or budget limits recorded.</p>';
    } else {
      html += '<table class="print-table"><thead><tr><th>Category</th><th>Spent</th><th>% of Total</th><th>Limit</th><th>Remaining / Over</th></tr></thead><tbody>';
      rows.forEach(function (r) {
        var diff = r.hasLimit ? round2(r.limit - r.spent) : null;
        var diffClass = diff !== null && diff < 0 ? 'print-amount-negative' : 'print-amount-positive';
        html += '<tr><td><span class="print-category-badge">' + escapeHtml(r.category) + '</span></td><td>' + formatCurrency(r.spent) + '</td><td>' +
          r.shareOfTotal + '%</td><td>' +
          (r.hasLimit ? formatCurrency(r.limit) : '—') + '</td><td>' +
          (diff !== null ? '<span class="' + diffClass + '">' + formatCurrency(Math.abs(diff)) + (diff < 0 ? ' over' : ' left') + '</span>' : '—') +
          '</td></tr>';
      });
      html += '</tbody></table>';
    }

    html += '<div class="print-section-title">Expenses</div>';
    html += '<table class="print-table"><thead><tr><th>Category</th><th>Description</th><th>Amount</th><th>Paid By</th><th>Payment</th><th>Date</th></tr></thead><tbody>';
    budget.expenses.forEach(function (exp) {
      var payer = findMember(budget, exp.paidBy);
      html += '<tr><td><span class="print-category-badge">' + escapeHtml(exp.category) + '</span></td><td>' + escapeHtml(exp.description) + '</td><td>' +
        formatCurrency(exp.amount) + '</td><td>' + escapeHtml(payer ? payer.name : '') + '</td><td>' +
        escapeHtml(exp.paymentMethod || '') + '</td><td>' + formatDate(exp.date) + '</td></tr>';
    });
    html += '</tbody></table>';

    var overRows = rows.filter(function (r) { return r.over; });
    if (overRows.length) {
      html += '<div class="print-section-title">Over-Budget Alerts</div><ul class="print-alert-list">';
      overRows.forEach(function (r) {
        html += '<li>' + escapeHtml(r.category) + ' is over budget by <span class="print-amount-negative">' + formatCurrency(r.spent - r.limit) + '</span></li>';
      });
      html += '</ul>';
    }

    var accent = document.documentElement.getAttribute('data-accent') || 'indigo';
    var printColors = Buddy.theme.printColors(accent);
    dom.printArea.style.setProperty('--print-primary', printColors.primary);
    dom.printArea.style.setProperty('--print-primary-light', printColors.light);

    dom.printArea.innerHTML = html;
    window.print();
  }
})();
