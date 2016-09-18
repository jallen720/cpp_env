import { readFileSync } from 'fs';
import { join } from "path";
import { _ } from "lodash";
import { load } from 'js-yaml';


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Data
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const OPEN_BRACKETS  = [ "{", "[" ];
const CLOSE_BRACKETS = [ "}", "]" ];
const TAB_SIZE       = 4;
const YAML_EXTENSION = ".yaml";
const LOG_DIVIDER    = _.repeat("/", 80);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Utilities
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function get_tabs(tab_count)
{
    return " ".repeat(TAB_SIZE * tab_count);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Interface
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export function get_resource_path(paths)
{
    return join(process.env.NODE_PATH, "..", "resources", _.reduce(paths, join_paths));
}


export function string_format(object)
{
    var text = "";
    var current_tab_count = 0;
    var previous_was_colon = false;
    var previous_was_escape = false;
    var is_in_string = false;

    _.forEach(JSON.stringify(object), (char) =>
    {
        if (is_in_string)
        {
            text += char;
        }
        else if (_.includes(OPEN_BRACKETS, char))
        {
            // Put newline between colon and new block.
            if (previous_was_colon)
            {
                text += "\n" + get_tabs(current_tab_count);
            }

            current_tab_count++;
            text += char + "\n" + get_tabs(current_tab_count);
        }
        else if (_.includes(CLOSE_BRACKETS, char))
        {
            current_tab_count--;
            text += "\n" + get_tabs(current_tab_count) + char;
        }
        else if (char === ",")
        {
            text += char + "\n" + get_tabs(current_tab_count);
        }
        else
        {
            // Put space between colon and normal value.
            if (previous_was_colon)
            {
                text += " ";
            }

            text += char;
        }

        if (!previous_was_escape && char === "\"")
        {
            is_in_string = !is_in_string;
        }

        previous_was_escape = is_in_string && char === "\\";
        previous_was_colon = !is_in_string && char === ":";
    });

    return text;
}


export function read_resource_file(paths)
{
    return readFileSync(get_resource_path(paths), "utf8");
}


export function read_yaml_file(paths)
{
    if (paths.length === 0)
    {
        console.error("No paths passed to read_yaml_file()!");
        process.exit();
    }

    paths[paths.length - 1] += YAML_EXTENSION;
    return load(read_resource_file(paths));
}

// For some reason path.join doesn't work when passed to _.reduce, so this is used instead.
export function join_paths(path_a, path_b)
{
    return join(path_a, path_b);
}


export function log_file(path, content)
{
    console.log(
        `/// ${ path } ${ _.repeat("/", LOG_DIVIDER.length - path.length - 5) }\n` +
        content + "\n" +
        LOG_DIVIDER + "\n\n\n");
}
