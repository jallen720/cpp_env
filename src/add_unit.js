import { join, sep } from "path";
import { Script, createContext } from "vm";
import { _ } from "lodash";

import
{
    writeFileSync,
    mkdirSync,
    existsSync,
}
from "fs";

import
{
    string_format,
    read_yaml_file,
    read_resource_file,
    join_paths,
}
from "cpp_env/utils"


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Utilities
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function get_invalid_file_key_message(invalid_file_key)
{
    return "\"" + invalid_file_key + "\" is not a valid file key!";
}


function get_unit_file_path(args, unit_file_data)
{
    return (
    {
        directory_paths : _.concat(unit_file_data.root_directory, args.sub_directory.split(sep)),
        file            : args.unit_name + unit_file_data.extension,
    });
}


function get_unit_file_include_path(unit_file_data)
{
    return _.reduce(_.concat(_.tail(unit_file_data.path.directory_paths), [ unit_file_data.path.file ]), join_paths);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// Entry Point
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function main()
{
    const args = process.argv;


    // Validate correct number of args were entered.
    if (args.length !== 6)
    {
        console.log("usage: unit_name namespace sub_directory file_keys");
        process.exit();
    }


    const add_unit_args =
    {
        unit_name     : args[2],
        namespace     : args[3],
        sub_directory : args[4],
        file_keys     : _.uniq(args[5].split("")),
    };

    const unit_files_data = read_yaml_file([ "data", "unit_files" ]);
    const unit_file_keys = _.map(unit_files_data, "key");

    const invalid_file_keys =
        _.filter(
            add_unit_args.file_keys,
            (file_key) => !_.includes(unit_file_keys, file_key));


    // Validate no invalid file keys were entered.
    if (invalid_file_keys.length > 0)
    {
        console.error(_.map(invalid_file_keys, get_invalid_file_key_message).join("\n"));
        process.exit();
    }


    const selected_unit_files_data =
        _.filter(
            unit_files_data,
            (unit_file_data) => _.includes(add_unit_args.file_keys, unit_file_data.key));

    const unit_files =
        _.map(
            selected_unit_files_data,
            (unit_file_data) =>
            {
                return (
                {
                    key      : unit_file_data.key,
                    path     : get_unit_file_path(add_unit_args, unit_file_data),
                    template : read_resource_file(_.concat([ "templates" ], unit_file_data.template_paths)),
                });
            });


    // Define scope variables and create context from scope to be used by templates.
    var context = { scope: {} };
    var scope = context.scope;
    scope.namespace = add_unit_args.namespace;
    scope.header_include_path = get_unit_file_include_path(_.find(unit_files, { key: "h" }));

    if (_.includes(add_unit_args.file_keys, "i"))
    {
        scope.template_impl_include_path = get_unit_file_include_path(_.find(unit_files, { key: "i" }));
    }

    const template_context = createContext(context);


    // Create unit files from templates.
    _.forEach(unit_files, (unit_file) =>
    {
        const path = unit_file.path;


        // Create all non-existant directories in unit file's path.
        var current_path = "";

        _.forEach(path.directory_paths, (directory_path) =>
        {
            current_path = join(current_path, directory_path);

            if (!existsSync(current_path))
            {
                mkdirSync(current_path);
            }
        });


        // Replace template variables with their associated values in template_context.scope.
        var template_parts = unit_file.template.split(/\[{2}(.*?)\]{2}/g);

        // Every other element in template_parts is a template variable (because the template is split by template
        // variable brackets), so replace every other element with its evaluated value from template_context.scope.
        for (var i = 1; i < template_parts.length; i += 2)
        {
            template_parts[i] = new Script(_.trim(template_parts[i]) + ";").runInContext(template_context);
        }


        // Trim all but last trailing newline.
        var template_parts = template_parts.join("").split("\n");

        while (
            template_parts.length > 1 &&
            template_parts[template_parts.length - 2] === "" &&
            template_parts[template_parts.length - 1] === "")
        {
            template_parts.pop();
        }


        // Write processed template to unit file.
        writeFileSync(join(_.reduce(path.directory_paths, join_paths), path.file), template_parts.join("\n"));
    });
}


main();
