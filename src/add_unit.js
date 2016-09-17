import { join } from 'path';
import { _ } from 'lodash';

import
{
    string_format,
    read_yaml_file,
    read_resource_file,
}
from 'cpp_env/utils'


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
    return join(
        unit_file_data.root_directory,

        // Counting on the user to enter the correct directory delimiter for their OS if sub_directory is multiple
        // levels deep.
        args.sub_directory,

        args.unit_name + unit_file_data.extension);
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
                    path     : get_unit_file_path(add_unit_args, unit_file_data),
                    template : read_resource_file([ "templates", unit_file_data.template ]),
                });
            });

    console.log(string_format(unit_files));
}


main();
