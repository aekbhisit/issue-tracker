"use client";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useTranslation } from "react-i18next";
import * as Icons from "../public/icons/index";
const {
  BoxCubeIcon,
  CalendarIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontalDotsIcon,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
  FolderIcon,
  AlertCircleIcon,
} = Icons;
import { adminMenuApiService } from "../app/admin/admin-menu/api";
import type { AdminMenu } from "../app/admin/admin-menu/types";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

// Icon mapping function
const getIconComponent = (iconName?: string | null): React.ReactNode => {
  if (!iconName) return <GridIcon />;

  // Dynamically get icon component from Icons
  const IconComponent = (Icons as any)[iconName];

  if (IconComponent) {
    return <IconComponent />;
  }

  // Fallback to GridIcon
  return <GridIcon />;
};

const normalizePath = (inputPath: string | null | undefined): string => {
  if (!inputPath) {
    return "/";
  }

  let normalized = inputPath.split("#")[0].split("?")[0];
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  normalized = normalized.replace(/\/+/g, "/");

  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized || "/";
};

const buildPathVariants = (inputPath: string): string[] => {
  const normalized = normalizePath(inputPath);

  if (normalized === "/") {
    return ["/"];
  }

  const segments = normalized.split("/").filter(Boolean);
  const variants: string[] = [];

  for (let i = segments.length; i >= 1; i -= 1) {
    variants.push(`/${segments.slice(0, i).join("/")}`);
  }

  variants.push("/");

  return Array.from(new Set(variants));
};

// navItems moved inside component

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { t, i18n } = useTranslation();

  // State for menu from DB
  const [dbMenuItems, setDbMenuItems] = useState<AdminMenu[]>([]);
  
  // Track if component has mounted (client-side only)
  const [mounted, setMounted] = useState<boolean>(false);
  
  // Initialize super admin status synchronously from localStorage (before first render)
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const userDataStr = localStorage.getItem('admin_user') || localStorage.getItem('user');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          const resolvedRoleId = Number(userData.roleId ?? userData.role?.id ?? userData.roleID ?? userData.role_id);
          return resolvedRoleId === 1;
        }
      } catch {
        // ignore parse errors
      }
    }
    return false;
  });
  
  const [isLoadingMenu, setIsLoadingMenu] = useState<boolean>(false); // Start with false to show default menu immediately
  
  // Set mounted state after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Default main menu items (core functionality)
  // NOTE: With basePath='/admin', paths should NOT include /admin prefix
  // Next.js automatically adds basePath, so '/dashboard' becomes '/admin/dashboard'
  const defaultMainMenuItems: NavItem[] = useMemo(() => [
    {
      icon: <GridIcon />,
      name: t('admin.menu.dashboard'),
      path: "/dashboard",
    },
    {
      icon: <FolderIcon />,
      name: t('admin.menu.projects') || 'Projects',
      path: "/projects",
    },
    {
      icon: <AlertCircleIcon />,
      name: t('admin.menu.issues') || 'Issues',
      path: "/issues",
    },
  ], [t]);

  // System menu items (administration only - for super admin)
  // NOTE: With basePath='/admin', paths should NOT include /admin prefix
  const systemMenuItems: NavItem[] = useMemo(() => [
    {
      icon: <GridIcon />,
      name: t('admin.menu.admin_menu'),
      path: "/admin-menu",
    },
    {
      icon: <UserCircleIcon />,
      name: t('admin.menu.user_management'),
      path: "/user",
    },
    {
      icon: <ListIcon />,
      name: t('admin.menu.roles'),
      path: "/role/admin",
    },
    {
      icon: <ListIcon />,
      name: t('admin.menu.permissions'),
      path: "/permission/admin",
    },
    {
      icon: <ListIcon />,
      name: t('admin.menu.activity_logs'),
      path: "/activity-log",
    },
    {
      icon: <BoxCubeIcon />,
      name: t('admin.menu.file_manager'),
      path: "/file-manager",
    },
  ], [t]);

  // Normalize database menu path by removing /admin prefix if present
  // With basePath='/admin', paths should NOT include /admin prefix
  // This is different from the top-level normalizePath which handles general path normalization
  const normalizeMenuPath = (path: string | null | undefined): string | undefined => {
    if (!path || path === '#') return path === '#' ? '#' : undefined;
    // Remove /admin prefix if present (database might have paths with /admin/ prefix)
    const normalized = path.startsWith('/admin/') 
      ? path.substring(7) // Remove '/admin/' (7 chars)
      : path.startsWith('/admin') 
        ? path.substring(6) // Remove '/admin' (6 chars)
        : path;
    // Ensure path starts with /
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  };

  // Convert DB menu to NavItem format
  const convertDBMenuToNavItems = useCallback((menus: AdminMenu[]): NavItem[] => {
    const currentLang = i18n.language || 'th';

    const flattenMenus = (items: AdminMenu[]): AdminMenu[] => {
      const result: AdminMenu[] = [];

      const traverse = (nodes: AdminMenu[]) => {
        nodes.forEach((node) => {
          result.push(node);
          if (node.children && node.children.length > 0) {
            traverse(node.children);
          }
        });
      };

      traverse(items);
      return result;
    };

    const getMenuName = (menu: AdminMenu, fallback: string) => {
      const translation = menu.translates?.find((t) => t.lang === currentLang);
      return translation?.name || menu.translates?.[0]?.name || fallback;
    };

    const allMenus = flattenMenus(menus);

    const sortBySequence = (a: AdminMenu, b: AdminMenu) =>
      (a.sequence ?? 0) - (b.sequence ?? 0);

    const rootMenus = allMenus.filter((menu) => menu.parentId == null);

    return rootMenus
      .sort(sortBySequence)
      .map((menu) => {
        const directChildren =
          menu.children && menu.children.length > 0
            ? menu.children
            : allMenus.filter((child) => child.parentId === menu.id);

        const subItems =
          directChildren && directChildren.length > 0
            ? directChildren
              .sort(sortBySequence)
              .map((child) => ({
                name: getMenuName(child, t('admin.menu.fallback.subMenu')),
                path: normalizeMenuPath(child.path) || '#',
                pro: false,
                new: false,
              }))
            : undefined;

        return {
          name: getMenuName(menu, t('admin.menu.fallback.menu')),
          icon: getIconComponent(menu.icon),
          path: subItems ? undefined : normalizeMenuPath(menu.path),
          subItems,
        };
      });
  }, [i18n.language, t]);

  const navItems: NavItem[] = useMemo(() => {
    // Always start with default main menu items
    const mergedItems: NavItem[] = [...defaultMainMenuItems];
    
    // Merge database menu items (even while loading, use what we have)
    if (dbMenuItems.length > 0) {
      const dbNavItems = convertDBMenuToNavItems(dbMenuItems);
      const defaultPaths = new Set(defaultMainMenuItems.map(item => item.path).filter(Boolean));
      
      // Add database items, replacing defaults if path matches
      dbNavItems.forEach(dbItem => {
        if (dbItem.path && defaultPaths.has(dbItem.path)) {
          // Replace default item with database version
          const index = mergedItems.findIndex(mi => mi.path === dbItem.path);
          if (index >= 0) {
            mergedItems[index] = dbItem;
          }
        } else {
          // Add new database item
          mergedItems.push(dbItem);
        }
      });
    }

    return mergedItems;
  }, [dbMenuItems, convertDBMenuToNavItems, defaultMainMenuItems]);

  const menuSections = useMemo(() => {
    const sections: Array<{ key: "main" | "system"; items: NavItem[] }> = [
      { key: "main", items: navItems },
    ];

    // Only check super admin status after component has mounted to avoid hydration mismatch
    // Use only isSuperAdmin state (which is initialized from localStorage) to avoid calling getSuperAdminStatus during render
    if (mounted && isSuperAdmin) {
      sections.push({ key: "system", items: systemMenuItems });
    }

    return sections;
  }, [navItems, isSuperAdmin, systemMenuItems, mounted]);

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "system"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${openSubmenu?.type === menuType && openSubmenu?.index === index
                ? "menu-item-active"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={` ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                    ? "rotate-180 text-brand-500"
                    : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`${isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${isActive(subItem.path)
                        ? "menu-dropdown-item-active"
                        : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                          >
                            {t('admin.menu.badges.new')}
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                          >
                            {t('admin.menu.badges.pro')}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "system";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (targetPath: string) => {
      if (!targetPath) {
        return false;
      }

      const normalizedTarget = normalizePath(targetPath);
      const normalizedCurrent = normalizePath(pathname);

      if (normalizedCurrent === normalizedTarget) {
        return true;
      }

      const currentVariants = buildPathVariants(normalizedCurrent);
      return currentVariants.includes(normalizedTarget);
    },
    [pathname],
  );

  // Check super admin status from localStorage first (immediate)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkSuperAdmin = () => {
        try {
          // Check both 'admin_user' (correct key) and 'user' (fallback)
          const userDataStr = localStorage.getItem('admin_user') || localStorage.getItem('user');
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            const resolvedRoleId = Number(userData.roleId ?? userData.role?.id ?? userData.roleID ?? userData.role_id);
            const isSuperAdminUser = resolvedRoleId === 1;
            setIsSuperAdmin(isSuperAdminUser);
            return isSuperAdminUser;
          }
        } catch {
          // ignore parse errors
        }
        setIsSuperAdmin(false);
        return false;
      };

      // Check immediately
      checkSuperAdmin();

      // Listen for custom storage events (when user logs in/out in same tab)
      const handleCustomStorage = (e: CustomEvent) => {
        if (e.detail?.key === 'admin_user' || e.detail?.key === 'user') {
          checkSuperAdmin();
        }
      };

      window.addEventListener('storage', () => checkSuperAdmin());
      window.addEventListener('localStorageChange', handleCustomStorage as EventListener);
      
      return () => {
        window.removeEventListener('storage', () => checkSuperAdmin());
        window.removeEventListener('localStorageChange', handleCustomStorage as EventListener);
      };
    }
  }, []);

  // Fetch menu from DB (non-blocking - show default menu immediately)
  useEffect(() => {
    const fetchMenuFromDB = async () => {
      // Only fetch on client side
      if (typeof window === 'undefined') return;
      
      try {
        setIsLoadingMenu(true);
        const response = await adminMenuApiService.getMenu();
        setDbMenuItems(response.menu || []);

        // Update super admin status from API response (more reliable than localStorage)
        if (typeof response.isSuperAdmin === "boolean") {
          setIsSuperAdmin(response.isSuperAdmin);
        }
      } catch (error) {
        // Silently fail - use default menu items
        // Don't log to console in production to avoid noise
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch menu from DB:', error);
        }
        setDbMenuItems([]);
      } finally {
        setIsLoadingMenu(false);
      }
    };

    // Fetch immediately but don't block render
    fetchMenuFromDB();
  }, [i18n.language]); // Refresh menu when language changes

  useEffect(() => {
    let submenuMatched = false;

    menuSections.forEach(({ key, items }) => {
      items.forEach((nav, index) => {
        if (!nav.subItems) return;

        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ type: key, index });
            submenuMatched = true;
          }
        });
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive, menuSections]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "system") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link href="/" className="flex items-center gap-3">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo-icon.svg"
                alt="Issue Collector"
                width={32}
                height={32}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo-icon.svg"
                alt="Issue Collector"
                width={32}
                height={32}
              />
              <span className="text-lg font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                Issue Collector
              </span>
            </>
          ) : (
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Issue Collector"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <>
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                    }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    t('admin.menu.menu')
                  ) : (
                    <HorizontalDotsIcon />
                  )}
                </h2>
                {navItems.length > 0 ? (
                  <>
                    {renderMenuItems(navItems, "main")}
                    {isLoadingMenu && (
                      <div className="flex items-center justify-center py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500"></div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                    {(isExpanded || isHovered || isMobileOpen) && t('admin.menu.fallback.noMenuItems')}
                  </div>
                )}
              </div>

              {mounted && isSuperAdmin && (
                <div>
                  <h2
                    className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                      }`}
                  >
                    {isExpanded || isHovered || isMobileOpen ? (
                      t('admin.menu.systemMenu')
                    ) : (
                      <HorizontalDotsIcon />
                    )}
                  </h2>
                  {renderMenuItems(systemMenuItems, "system")}
                </div>
              )}
            </>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
