import { memo } from 'react';

const NavigationItem = memo(({ item }) => (
  <a key={item.href} href={item.href} className="simple-link">
    {item.title}
  </a>
));

NavigationItem.displayName = 'NavigationItem';

const NavigationSection = memo(({ title, items }) => (
  <div className="simple-section">
    <h4>{title}</h4>
    {items.map((item, index) => (
      <NavigationItem key={index} item={item} />
    ))}
  </div>
));

NavigationSection.displayName = 'NavigationSection';

const NavigationDropdown = memo(({ title, sections }) => (
  <div className="simple-nav-item">
    <span className="simple-nav-title">{title}</span>
    <div className="simple-dropdown">
      {sections.map((section, index) => (
        <NavigationSection 
          key={index} 
          title={section.title} 
          items={section.items} 
        />
      ))}
    </div>
  </div>
));

NavigationDropdown.displayName = 'NavigationDropdown';

export { NavigationItem, NavigationSection, NavigationDropdown };