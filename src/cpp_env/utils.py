from os import path
from functools import reduce
from __main__ import __file__


_OPEN_BRACKETS = [ "[", "{" ]
_CLOSE_BRACKETS = [ "]", "}" ]
_TAB_SIZE = 4


def resource_path(relative_paths):
    return path.join(path.dirname(__file__), '..', 'resources', reduce(path.join, relative_paths))


def _get_tabs(tab_count):
    return " " * _TAB_SIZE * tab_count


def pretty_print(obj):
    print(str(obj))
    text = ""
    current_tab_count = 0
    last_was_comma = False

    for char in str(obj):
        # Ignore space after comma
        if last_was_comma:
            last_was_comma = False
            continue

        # Print newlines and adjust tabs around open / close brackets and commas
        if char in _OPEN_BRACKETS:
            current_tab_count += 1
            text += char + "\n" + _get_tabs(current_tab_count)

        elif char in _CLOSE_BRACKETS:
            current_tab_count -= 1
            text += "\n" + _get_tabs(current_tab_count) + char

        elif char == ",":
            text += char + "\n" + _get_tabs(current_tab_count)
            last_was_comma = True

        else:
            text += char

    print(text)


